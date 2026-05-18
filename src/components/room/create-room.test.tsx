import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CreateRoom } from './create-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('nanoid', () => ({ nanoid: () => 'testroom123' }))

function renderCreateRoom() {
  return render(
    <MemoryRouter>
      <CreateRoom />
    </MemoryRouter>
  )
}

describe('CreateRoom', () => {
  it('renders the card title and description', () => {
    renderCreateRoom()
    expect(screen.getByText('Start a Room')).toBeInTheDocument()
    expect(
      screen.getByText('Share the QR code with your partner to connect')
    ).toBeInTheDocument()
  })

  it('renders the timeout slider with accessible label', () => {
    renderCreateRoom()
    const slider = screen.getByRole('slider', { name: 'Auto-reconnect timeout' })
    expect(slider).toBeInTheDocument()
  })

  it('shows range labels for 5 min and 2 hr', () => {
    renderCreateRoom()
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('2 hr')).toBeInTheDocument()
  })

  it('shows default timeout of 1 hr', () => {
    renderCreateRoom()
    const displays = screen.getAllByText('1 hr')
    expect(displays.length).toBeGreaterThan(0)
  })

  it('renders Create Room button', () => {
    renderCreateRoom()
    const btn = screen.getByRole('button', { name: /create room/i })
    expect(btn).toBeInTheDocument()
  })

  it('navigates with creator role and timeout on button click', () => {
    renderCreateRoom()
    const btn = screen.getByRole('button', { name: /create room/i })
    fireEvent.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/room/testroom123?role=creator&timeout=')
    )
  })

  it('updates displayed timeout when slider changes', () => {
    renderCreateRoom()
    const slider = screen.getByRole('slider', { name: 'Auto-reconnect timeout' })
    fireEvent.change(slider, { target: { value: '600000' } })
    expect(screen.getAllByText('10 min').length).toBeGreaterThan(0)
  })
})
