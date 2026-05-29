import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './home-page'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})
vi.mock('@/components/qr/qr-scanner', () => ({ QrScanner: () => <div>scanner</div> }))
vi.mock('@/components/qr/qr-upload', () => ({ QrUpload: () => <div>upload</div> }))

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  it('renders the hero heading', () => {
    renderHome()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/stay close/i)
  })

  it('shows Start and Join as a segmented control with Start selected by default', () => {
    renderHome()
    expect(screen.getByRole('radiogroup', { name: /start or join/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /start a room/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
  })

  it('switches to the Join panel when "Join a room" is selected', async () => {
    renderHome()
    fireEvent.click(screen.getByRole('radio', { name: /join a room/i }))
    expect(await screen.findByRole('radiogroup', { name: 'Join method' })).toBeInTheDocument()
  })
})
