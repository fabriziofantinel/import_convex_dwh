import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmModal } from '@/components/apps/DeleteConfirmModal'

const mockHandlers = {
  onConfirm: jest.fn(),
  onCancel: jest.fn()
}

describe('DeleteConfirmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when not open', () => {
    const { container } = render(
      <DeleteConfirmModal 
        isOpen={false} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when open', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    expect(screen.getByText('Delete Application')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    expect(screen.getByText('test-app')).toBeInTheDocument()
  })

  it('displays app name in confirmation message', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="my-special-app" 
        {...mockHandlers} 
      />
    )
    
    expect(screen.getByText('my-special-app')).toBeInTheDocument()
  })

  it('calls onConfirm when delete button is clicked', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(mockHandlers.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when backdrop is clicked', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    fireEvent.click(backdrop!)
    
    expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when deleting', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        isDeleting={true}
        {...mockHandlers} 
      />
    )
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('disables buttons when deleting', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        isDeleting={true}
        {...mockHandlers} 
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /Deleting/i })
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    
    expect(deleteButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('does not call handlers when buttons are disabled', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        isDeleting={true}
        {...mockHandlers} 
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /Deleting/i })
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    
    fireEvent.click(deleteButton)
    fireEvent.click(cancelButton)
    
    expect(mockHandlers.onConfirm).not.toHaveBeenCalled()
    expect(mockHandlers.onCancel).not.toHaveBeenCalled()
  })

  it('shows warning icon', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        {...mockHandlers} 
      />
    )
    
    const iconContainer = document.querySelector('.bg-red-100')
    expect(iconContainer).toBeInTheDocument()
    
    const icon = iconContainer?.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('shows loading spinner when deleting', () => {
    render(
      <DeleteConfirmModal 
        isOpen={true} 
        appName="test-app" 
        isDeleting={true}
        {...mockHandlers} 
      />
    )
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})