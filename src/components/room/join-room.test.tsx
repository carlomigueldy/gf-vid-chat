import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JoinRoom } from './join-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/components/qr/qr-scanner', () => ({
  QrScanner: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/abc123?role=joiner')}>Mock scan</button>
  ),
}))
vi.mock('@/components/qr/qr-upload', () => ({
  QrUpload: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/xyz456?role=joiner')}>Mock upload</button>
  ),
}))

function renderJoinRoom() {
  return render(
    <MemoryRouter>
      <JoinRoom />
    </MemoryRouter>
  )
}

describe('JoinRoom', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders three method options', () => {
    renderJoinRoom()
    const group = screen.getByRole('radiogroup', { name: 'Join method' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('Scan method is selected by default', () => {
    renderJoinRoom()
    expect(screen.getByRole('radio', { name: /scan/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('switches to Paste method on click', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    expect(screen.getByPlaceholderText('Paste room link or ID…')).toBeInTheDocument()
  })

  it('shows error when pasting invalid input', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: '!!' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('navigates to room on valid room ID paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: 'abc1234567' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc1234567?role=joiner')
  })

  it('navigates to room on valid full URL paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: 'https://example.com/room/room1234?role=joiner' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/room1234?role=joiner')
  })

  it('navigates via QrScanner result (default method)', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('button', { name: 'Mock scan' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc123?role=joiner')
  })

  it('navigates via Upload result', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /upload/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Mock upload' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/xyz456?role=joiner')
  })
})
