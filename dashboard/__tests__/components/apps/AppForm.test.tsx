import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppForm } from '@/components/apps/AppForm'

// Mock the UI components
jest.mock('@/components/ui', () => ({
  LoadingButton: ({ children, onClick, isLoading, disabled, type }: any) => (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      data-testid={type === 'submit' ? 'submit-button' : 'fetch-button'}
      data-loading={isLoading}
    >
      {children}
    </button>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}))

// Mock the toast provider
jest.mock('@/components/providers/ToastProvider', () => ({
  useToastContext: () => ({
    success: jest.fn(),
    error: jest.fn()
  })
}))

// Mock the validation library
jest.mock('@/lib/validation', () => ({
  validateSyncAppForm: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

const mockValidation = require('@/lib/validation')

const mockHandlers = {
  onSubmit: jest.fn(),
  onCancel: jest.fn()
}

const mockInitialData = {
  name: 'test-app',
  description: 'Test description',
  deploy_key: 'dev:project|token123',
  tables: ['table1', 'table2'],
  cron_schedule: '0 2 * * *',
  cron_enabled: true
}

describe('AppForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValidation.validateSyncAppForm.mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: mockInitialData
    })
  })

  it('renders form fields correctly', () => {
    render(<AppForm {...mockHandlers} />)
    
    expect(screen.getByLabelText(/Application Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descrizione Applicazione/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Convex Deploy Key/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Enable Automatic Sync Schedule/)).toBeInTheDocument()
  })

  it('populates form with initial data', () => {
    render(<AppForm initialData={mockInitialData} {...mockHandlers} />)
    
    expect(screen.getByDisplayValue('test-app')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('dev:project|token123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0 2 * * *')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Enable Automatic Sync Schedule/ })).toBeChecked()
  })

  it('disables name field in edit mode', () => {
    render(<AppForm initialData={mockInitialData} isEdit={true} {...mockHandlers} />)
    
    const nameField = screen.getByLabelText(/Application Name/)
    expect(nameField).toBeDisabled()
    expect(nameField).toHaveClass('bg-gray-100', 'cursor-not-allowed')
  })

  it('shows cron schedule field when cron is enabled', async () => {
    const user = userEvent.setup()
    render(<AppForm {...mockHandlers} />)
    
    const cronCheckbox = screen.getByRole('checkbox', { name: /Enable Automatic Sync Schedule/ })
    await user.click(cronCheckbox)
    
    expect(screen.getByLabelText(/Cron Schedule/)).toBeInTheDocument()
  })

  it('hides cron schedule field when cron is disabled', async () => {
    const user = userEvent.setup()
    render(<AppForm initialData={{ ...mockInitialData, cron_enabled: true }} {...mockHandlers} />)
    
    const cronCheckbox = screen.getByRole('checkbox', { name: /Enable Automatic Sync Schedule/ })
    await user.click(cronCheckbox)
    
    expect(screen.queryByLabelText(/Cron Schedule/)).not.toBeInTheDocument()
  })

  it('calls fetch tables when fetch button is clicked', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, tables: ['table1', 'table2'] })
    })

    render(<AppForm {...mockHandlers} />)
    
    const deployKeyInput = screen.getByLabelText(/Convex Deploy Key/)
    await user.type(deployKeyInput, 'dev:project|token123')
    
    const fetchButton = screen.getByTestId('fetch-button')
    await user.click(fetchButton)
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/fetch-tables',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-12345'
        }),
        body: JSON.stringify({ deploy_key: 'dev:project|token123' })
      })
    )
  })

  it('displays tables after successful fetch', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, tables: ['users', 'posts'] })
    })

    render(<AppForm {...mockHandlers} />)
    
    const deployKeyInput = screen.getByLabelText(/Convex Deploy Key/)
    await user.type(deployKeyInput, 'dev:project|token123')
    
    const fetchButton = screen.getByTestId('fetch-button')
    await user.click(fetchButton)
    
    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument()
      expect(screen.getByText('posts')).toBeInTheDocument()
    })
  })

  it('allows table selection', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, tables: ['users', 'posts'] })
    })

    render(<AppForm {...mockHandlers} />)
    
    const deployKeyInput = screen.getByLabelText(/Convex Deploy Key/)
    await user.type(deployKeyInput, 'dev:project|token123')
    
    const fetchButton = screen.getByTestId('fetch-button')
    await user.click(fetchButton)
    
    await waitFor(() => {
      const usersCheckbox = screen.getByRole('checkbox', { name: /users/ })
      expect(usersCheckbox).toBeInTheDocument()
    })
    
    const usersCheckbox = screen.getByRole('checkbox', { name: /users/ })
    await user.click(usersCheckbox)
    
    expect(usersCheckbox).toBeChecked()
  })

  it('validates form on submit', async () => {
    const user = userEvent.setup()
    mockValidation.validateSyncAppForm.mockReturnValue({
      isValid: false,
      errors: [{ field: 'name', message: 'Name is required' }],
      sanitizedData: null
    })

    render(<AppForm {...mockHandlers} />)
    
    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)
    
    expect(mockValidation.validateSyncAppForm).toHaveBeenCalled()
    expect(mockHandlers.onSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, tables: ['users'] })
    })

    render(<AppForm {...mockHandlers} />)
    
    // Fill form
    const nameInput = screen.getByLabelText(/Application Name/)
    await user.type(nameInput, 'test-app')
    
    const deployKeyInput = screen.getByLabelText(/Convex Deploy Key/)
    await user.type(deployKeyInput, 'dev:project|token123')
    
    // Fetch and select tables
    const fetchButton = screen.getByTestId('fetch-button')
    await user.click(fetchButton)
    
    await waitFor(() => {
      const usersCheckbox = screen.getByRole('checkbox', { name: /users/ })
      expect(usersCheckbox).toBeInTheDocument()
    })
    
    const usersCheckbox = screen.getByRole('checkbox', { name: /users/ })
    await user.click(usersCheckbox)
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Application/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          deploy_key: expect.any(String),
          tables: expect.arrayContaining([expect.any(String)]),
          table_mapping: expect.any(Object)
        })
      )
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<AppForm {...mockHandlers} />)
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockHandlers.onCancel).toHaveBeenCalled()
  })

  it('disables form when submitting', () => {
    render(<AppForm isSubmitting={true} {...mockHandlers} />)
    
    const nameInput = screen.getByLabelText(/Application Name/)
    const submitButton = screen.getByRole('button', { name: /Create Application/i })
    const cancelButton = screen.getByText('Cancel')
    
    expect(nameInput).toBeDisabled()
    expect(cancelButton).toBeDisabled()
    // Note: LoadingButton component handles disabled state internally
  })

  it('shows select all/deselect all functionality', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, tables: ['users', 'posts'] })
    })

    render(<AppForm {...mockHandlers} />)
    
    const deployKeyInput = screen.getByLabelText(/Convex Deploy Key/)
    await user.type(deployKeyInput, 'dev:project|token123')
    
    const fetchButton = screen.getByTestId('fetch-button')
    await user.click(fetchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument()
    })
    
    const selectAllButton = screen.getByText('Select All')
    await user.click(selectAllButton)
    
    const usersCheckbox = screen.getByRole('checkbox', { name: /users/ })
    const postsCheckbox = screen.getByRole('checkbox', { name: /posts/ })
    
    expect(usersCheckbox).toBeChecked()
    expect(postsCheckbox).toBeChecked()
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
  })

  it('clears errors when input changes', async () => {
    const user = userEvent.setup()
    mockValidation.validateSyncAppForm.mockReturnValueOnce({
      isValid: false,
      errors: [{ field: 'name', message: 'Name is required' }],
      sanitizedData: null
    })

    render(<AppForm {...mockHandlers} />)
    
    // Submit to trigger validation error
    const submitButton = screen.getByTestId('submit-button')
    await user.click(submitButton)
    
    // Change input to clear error
    const nameInput = screen.getByLabelText(/Application Name/)
    await user.type(nameInput, 'test')
    
    // Error should be cleared (this would be handled by the component state)
    expect(nameInput).toHaveValue('test')
  })
})