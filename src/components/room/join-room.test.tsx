import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JoinRoom } from './join-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// QrScanner uses html5-qrcode which needs browser APIs — mock it
vi.mock('@/components/qr/qr-scanner', () => ({
  QrScanner: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/abc123?role=joiner')}>
      Mock scan
    </button>
  ),
}))

vi.mock('@/components/qr/qr-upload', () => ({
  QrUpload: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/xyz456?role=joiner')}>
      Mock upload
    </button>
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
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders the card title', () => {
    renderJoinRoom()
    expect(screen.getByText('Join a Room')).toBeInTheDocument()
  })

  it('renders three tab buttons', () => {
    renderJoinRoom()
    const tablist = screen.getByRole('tablist', { name: 'Join method' })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('Scan tab is selected by default', () => {
    renderJoinRoom()
    const scanTab = screen.getByRole('tab', { name: /scan qr/i })
    expect(scanTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to Paste tab on click', () => {
    renderJoinRoom()
    const pasteTab = screen.getByRole('tab', { name: /paste/i })
    fireEvent.click(pasteTab)
    expect(pasteTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByPlaceholderText('Paste room link or ID…')).toBeInTheDocument()
  })

  it('shows error when pasting invalid input', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('tab', { name: /paste/i }))
    const input = screen.getByPlaceholderText('Paste room link or ID…')
    fireEvent.change(input, { target: { value: '!!' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('navigates to room on valid room ID paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('tab', { name: /paste/i }))
    const input = screen.getByPlaceholderText('Paste room link or ID…')
    fireEvent.change(input, { target: { value: 'abc1234567' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc1234567?role=joiner')
  })

  it('navigates to room on valid full URL paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('tab', { name: /paste/i }))
    const input = screen.getByPlaceholderText('Paste room link or ID…')
    fireEvent.change(input, { target: { value: 'https://example.com/room/room1234?role=joiner' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/room1234?role=joiner')
  })

  it('navigates via QrScanner result', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('button', { name: 'Mock scan' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc123?role=joiner')
  })

  it('navigates via Upload result', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('tab', { name: /upload qr/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Mock upload' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/xyz456?role=joiner')
  })
})
