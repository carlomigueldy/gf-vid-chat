import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReconnectOverlay } from './reconnect-overlay'

describe('ReconnectOverlay', () => {
  it('renders a reassuring status message', () => {
    render(<ReconnectOverlay />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/hang tight/i)).toBeInTheDocument()
    expect(screen.getByText(/reconnecting you/i)).toBeInTheDocument()
  })

  it('shows the attempt number when retryCount > 0', () => {
    render(<ReconnectOverlay retryCount={3} />)
    expect(screen.getByText(/attempt 3/i)).toBeInTheDocument()
  })

  it('omits the attempt line when retryCount is 0', () => {
    render(<ReconnectOverlay retryCount={0} />)
    expect(screen.queryByText(/attempt/i)).not.toBeInTheDocument()
  })
})
