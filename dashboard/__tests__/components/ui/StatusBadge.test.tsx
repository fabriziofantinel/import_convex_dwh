import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders success status with correct styling', () => {
    render(<StatusBadge status="success" />)
    
    const badge = screen.getByText('Success')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('renders failed status with correct styling', () => {
    render(<StatusBadge status="failed" />)
    
    const badge = screen.getByText('Failed')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders running status with correct styling', () => {
    render(<StatusBadge status="running" />)
    
    const badge = screen.getByText('Running')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('renders never_run status with correct styling', () => {
    render(<StatusBadge status="never_run" />)
    
    const badge = screen.getByText('Never Run')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('renders pending status with correct styling', () => {
    render(<StatusBadge status="pending" />)
    
    const badge = screen.getByText('Pending')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })
})