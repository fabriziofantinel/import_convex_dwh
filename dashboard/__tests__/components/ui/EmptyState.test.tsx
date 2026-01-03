import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState 
        title="No items found" 
        description="There are no items to display"
      />
    )
    
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display')).toBeInTheDocument()
  })

  it('renders with action button when provided', () => {
    const action = {
      label: 'Add Item',
      onClick: jest.fn()
    }
    
    render(
      <EmptyState 
        title="No items found" 
        description="There are no items to display"
        action={action}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Add Item' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', () => {
    const action = {
      label: 'Add Item',
      onClick: jest.fn()
    }
    
    render(
      <EmptyState 
        title="No items found" 
        description="There are no items to display"
        action={action}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Add Item' })
    button.click()
    
    expect(action.onClick).toHaveBeenCalledTimes(1)
  })

  it('renders without action button when not provided', () => {
    render(
      <EmptyState 
        title="No items found" 
        description="There are no items to display"
      />
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})