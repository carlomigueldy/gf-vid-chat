import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TurnSettings } from './turn-settings'

describe('TurnSettings', () => {
  beforeEach(() => localStorage.clear())

  it('shows STUN-only status by default', () => {
    render(<TurnSettings />)
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })

  it('saves a valid TURN relay to localStorage and shows configured status', () => {
    render(<TurnSettings />)
    fireEvent.change(screen.getByLabelText('TURN URL'), { target: { value: 'turn:turn.example.com:3478' } })
    fireEvent.change(screen.getByLabelText('TURN username'), { target: { value: 'u' } })
    fireEvent.change(screen.getByLabelText('TURN password'), { target: { value: 'p' } })
    fireEvent.click(screen.getByRole('button', { name: /save relay/i }))
    expect(JSON.parse(localStorage.getItem('gfvc-turn')!)).toEqual({
      urls: 'turn:turn.example.com:3478',
      username: 'u',
      credential: 'p',
    })
    expect(screen.getByText(/relay configured/i)).toBeInTheDocument()
  })

  it('rejects an invalid URL with an alert and does not persist', () => {
    render(<TurnSettings />)
    fireEvent.change(screen.getByLabelText('TURN URL'), { target: { value: 'http://nope' } })
    fireEvent.click(screen.getByRole('button', { name: /save relay/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(localStorage.getItem('gfvc-turn')).toBeNull()
  })

  it('removes a configured relay', () => {
    localStorage.setItem('gfvc-turn', JSON.stringify({ urls: 'turn:x:3478' }))
    render(<TurnSettings />)
    expect(screen.getByText(/relay configured/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(localStorage.getItem('gfvc-turn')).toBeNull()
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })
})
