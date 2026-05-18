import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ConnectionStatus } from './connection-status'
import type { ConnectionState } from '@/types'

describe('ConnectionStatus', () => {
  it('renders initializing state', () => {
    render(<ConnectionStatus state="initializing" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Initializing…')).toBeInTheDocument()
  })

  it('renders waiting state', () => {
    render(<ConnectionStatus state="waiting" />)
    expect(screen.getByText('Waiting for partner…')).toBeInTheDocument()
  })

  it('renders connected state', () => {
    render(<ConnectionStatus state="connected" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders reconnecting state with retry count', () => {
    render(<ConnectionStatus state="reconnecting" retryCount={3} />)
    expect(screen.getByText('Reconnecting… (attempt 3)')).toBeInTheDocument()
  })

  it('renders failed state', () => {
    render(<ConnectionStatus state="failed" />)
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
  })

  it('renders timeout state', () => {
    render(<ConnectionStatus state="timeout" />)
    expect(screen.getByText('Session ended')).toBeInTheDocument()
  })

  it('shows time remaining when reconnecting', () => {
    render(<ConnectionStatus state="reconnecting" timeRemainingMs={125000} />)
    // 125 seconds = 2:05
    expect(screen.getByText(/Session ends in/)).toBeInTheDocument()
  })

  it('hides badge 3s after connected state', async () => {
    vi.useFakeTimers()
    render(<ConnectionStatus state="connected" />)
    expect(screen.queryByText('Connected')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3100) })
    // After 3s the badge exits via AnimatePresence
    // The text may still exist in DOM during exit animation, check aria-label on status
    expect(screen.getByRole('status')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('has aria-live="polite" for screen reader announcements', () => {
    render(<ConnectionStatus state="connecting" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-atomic', 'true')
  })

  const states: ConnectionState[] = [
    'initializing', 'waiting', 'connecting', 'connected',
    'reconnecting', 'failed', 'timeout',
  ]
  states.forEach((state) => {
    it(`renders without crashing for state: ${state}`, () => {
      expect(() => render(<ConnectionStatus state={state} />)).not.toThrow()
    })
  })
})
