import { render, screen, fireEvent } from '@testing-library/react'
import { AppCard } from '@/components/dashboard/AppCard'
import type { Id } from '@/convex/_generated/dataModel'

// Mock the UI components
jest.mock('@/components/ui', () => ({
  StatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
  LoadingButton: ({ children, onClick, isLoading, disabled }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid="sync-button"
      data-loading={isLoading}
    >
      {children}
    </button>
  )
}))

const mockApp = {
  _id: 'test-id' as Id<'sync_apps'>,
  name: 'Test App',
  description: 'Test description',
  tables: ['table1', 'table2']
}

const mockLastJob = {
  status: 'success' as const,
  completed_at: Date.now(),
  duration_seconds: 120,
  tables_processed: 2,
  rows_imported: 100
}

const mockHandlers = {
  onSyncNow: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewLogs: jest.fn()
}

describe('AppCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders app information correctly', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    expect(screen.getByText('Test App')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('2 tables')).toBeInTheDocument()
  })

  it('renders single table text correctly', () => {
    const singleTableApp = { ...mockApp, tables: ['table1'] }
    render(<AppCard app={singleTableApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    expect(screen.getByText('1 table')).toBeInTheDocument()
  })

  it('displays status badge', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    const statusBadge = screen.getByTestId('status-badge')
    expect(statusBadge).toHaveTextContent('success')
  })

  it('displays never_run status when no lastJob', () => {
    render(<AppCard app={mockApp} {...mockHandlers} />)
    
    const statusBadge = screen.getByTestId('status-badge')
    expect(statusBadge).toHaveTextContent('never_run')
  })

  it('displays job statistics', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    expect(screen.getByText('2m 0s')).toBeInTheDocument() // duration
    expect(screen.getByText('2')).toBeInTheDocument() // tables processed
    expect(screen.getByText('100')).toBeInTheDocument() // rows imported
  })

  it('displays N/A for missing statistics', () => {
    const jobWithoutStats = { status: 'success' as const }
    render(<AppCard app={mockApp} lastJob={jobWithoutStats} {...mockHandlers} />)
    
    expect(screen.getAllByText('N/A')).toHaveLength(3) // duration, tables, rows
  })

  it('shows cron schedule when enabled', () => {
    // This test is no longer relevant since cron functionality was removed
    // Keeping as placeholder or can be removed entirely
    expect(true).toBe(true)
  })

  it('shows error message for failed jobs', () => {
    const failedJob = { 
      status: 'failed' as const, 
      error_message: 'Connection failed' 
    }
    render(<AppCard app={mockApp} lastJob={failedJob} {...mockHandlers} />)
    
    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Connection failed')).toBeInTheDocument()
  })

  it('calls onSyncNow when sync button is clicked', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    const syncButton = screen.getByTestId('sync-button')
    fireEvent.click(syncButton)
    
    expect(mockHandlers.onSyncNow).toHaveBeenCalledWith(mockApp._id)
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockApp._id)
  })

  it('calls onViewLogs when logs button is clicked', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    const logsButton = screen.getByText('Logs')
    fireEvent.click(logsButton)
    
    expect(mockHandlers.onViewLogs).toHaveBeenCalledWith(mockApp._id)
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} {...mockHandlers} />)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockApp._id)
  })

  it('disables sync button when syncing', () => {
    render(<AppCard app={mockApp} lastJob={mockLastJob} isSyncing={true} {...mockHandlers} />)
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeDisabled()
    expect(syncButton).toHaveAttribute('data-loading', 'true')
  })

  it('disables sync button when job is running', () => {
    const runningJob = { status: 'running' as const }
    render(<AppCard app={mockApp} lastJob={runningJob} {...mockHandlers} />)
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeDisabled()
  })
})