import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CreateRoom } from './create-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
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
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  it('renders the timeout slider with accessible label', () => {
    renderCreateRoom()
    expect(screen.getByRole('slider', { name: 'Auto-reconnect timeout' })).toBeInTheDocument()
  })

  it('shows range labels for 5 min and 2 hr', () => {
    renderCreateRoom()
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('2 hr')).toBeInTheDocument()
  })

  it('shows default timeout of 1 hr', () => {
    renderCreateRoom()
    expect(screen.getAllByText('1 hr').length).toBeGreaterThan(0)
  })

  it('renders Create Room button', () => {
    renderCreateRoom()
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
  })

  it('navigates with creator role and timeout on button click', () => {
    renderCreateRoom()
    fireEvent.click(screen.getByRole('button', { name: /create room/i }))
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
