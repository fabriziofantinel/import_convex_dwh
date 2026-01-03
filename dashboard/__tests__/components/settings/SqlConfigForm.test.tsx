import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SqlConfigForm } from '@/components/settings/SqlConfigForm'

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn()
}))

// Mock auth hook
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

// Mock encryption
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn()
}))

// Mock UI components
jest.mock('@/components/ui', () => ({
  LoadingButton: ({ children, onClick, isLoading, disabled, type }: any) => (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      data-testid="submit-button"
      data-loading={isLoading}
    >
      {children}
    </button>
  )
}))

// Mock toast provider
jest.mock('@/components/providers/ToastProvider', () => ({
  useToastContext: () => ({
    success: jest.fn(),
    error: jest.fn()
  })
}))

// Mock validation
jest.mock('@/lib/validation', () => ({
  validateSqlConfigForm: jest.fn()
}))

const mockConvex = require('convex/react')
const mockAuth = require('@/lib/hooks/useAuth')
const mockEncryption = require('@/lib/encryption')
const mockValidation = require('@/lib/validation')

const mockUpdateSqlConfig = jest.fn()
const mockUser = { sub: 'user123' }

describe('SqlConfigForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockConvex.useQuery.mockReturnValue(null)
    mockConvex.useMutation.mockReturnValue(mockUpdateSqlConfig)
    mockAuth.useAuth.mockReturnValue({ user: mockUser })
    mockEncryption.encrypt.mockReturnValue('encrypted-password')
    mockValidation.validateSqlConfigForm.mockReturnValue({
      isValid: true,
      errors: [],
      sanitizedData: {
        host: 'localhost',
        database: 'testdb',
        schema: 'dbo',
        username: 'testuser',
        password: 'password123',
        timeout: 30
      }
    })
  })

  it('renders form fields correctly', () => {
    render(<SqlConfigForm />)
    
    expect(screen.getByLabelText(/Host/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Database/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Schema/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Timeout/)).toBeInTheDocument()
  })

  it('populates form with existing config', () => {
    const existingConfig = {
      host: 'existing-host',
      database: 'existing-db',
      schema: 'existing-schema',
      username: 'existing-user',
      timeout: 60
    }
    
    mockConvex.useQuery.mockReturnValue(existingConfig)
    
    render(<SqlConfigForm />)
    
    expect(screen.getByDisplayValue('existing-host')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-db')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-schema')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-user')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<SqlConfigForm />)
    
    const passwordInput = screen.getByLabelText(/Password/)
    const toggleButton = screen.getByRole('button', { name: '' })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('shows default timeout value', () => {
    render(<SqlConfigForm />)
    
    const timeoutInput = screen.getByLabelText(/Timeout/)
    expect(timeoutInput).toHaveValue(30)
  })

  it('updates timeout value', async () => {
    const user = userEvent.setup()
    render(<SqlConfigForm />)
    
    const timeoutInput = screen.getByLabelText(/Timeout/)
    await user.clear(timeoutInput)
    await user.type(timeoutInput, '60')
    
    expect(timeoutInput).toHaveValue(60)
  })
})