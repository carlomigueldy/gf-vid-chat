import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from './settings-page'
import { ThemeProvider } from '@/context/theme-context'

function renderSettings() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear())

  it('renders the Settings heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument()
  })

  it('renders the theme radiogroup with three options', () => {
    renderSettings()
    const group = screen.getByRole('radiogroup', { name: 'Theme' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('selecting Dark updates the theme selection', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }))
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('renders the default-timeout slider and mirror switch', () => {
    renderSettings()
    expect(screen.getByRole('slider', { name: /default auto-reconnect/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /mirror my video/i })).toBeInTheDocument()
  })

  it('toggles the mirror switch and persists it', () => {
    renderSettings()
    const sw = screen.getByRole('switch', { name: /mirror my video/i })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(localStorage.getItem('gfvc-mirror-video')).toBe('false')
  })

  it('toggles the keep-screen-awake switch and persists it', () => {
    renderSettings()
    const sw = screen.getByRole('switch', { name: /keep screen awake/i })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(localStorage.getItem('gfvc-keep-screen-awake')).toBe('false')
  })

  it('renders the About section with a GitHub link', () => {
    renderSettings()
    expect(screen.getByText(/version/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view source on github/i })).toBeInTheDocument()
  })

  it('renders the Connectivity TURN section', () => {
    renderSettings()
    expect(screen.getByLabelText('TURN URL')).toBeInTheDocument()
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })
})
