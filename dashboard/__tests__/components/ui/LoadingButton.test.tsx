import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingButton } from '@/components/ui/LoadingButton'

describe('LoadingButton', () => {
  it('renders button with text when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('shows loading state and disables button when loading', () => {
    render(<LoadingButton isLoading>Click me</LoadingButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked and not loading', () => {
    const handleClick = jest.fn()
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', () => {
    const handleClick = jest.fn()
    render(<LoadingButton isLoading onClick={handleClick}>Click me</LoadingButton>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<LoadingButton className="custom-class">Click me</LoadingButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toHaveClass('custom-class')
  })

  it('applies disabled state', () => {
    render(<LoadingButton disabled>Click me</LoadingButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeDisabled()
  })

  it('shows custom loading text', () => {
    render(<LoadingButton isLoading loadingText="Processing...">Click me</LoadingButton>)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('shows spinner when loading', () => {
    render(<LoadingButton isLoading>Click me</LoadingButton>)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})