import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './header'
import { ThemeProvider } from '@/context/theme-context'

function renderHeader(path = '/') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Header />
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('Header', () => {
  it('renders the logo text', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByLabelText('gf-vid-chat home')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('marks Home link as current page on /', () => {
    renderHeader('/')
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  it('marks Settings link as current page on /settings', () => {
    renderHeader('/settings')
    const settingsLink = screen.getByRole('link', { name: 'Settings' })
    expect(settingsLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders theme toggle button with accessible label', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: /switch to/i })
    expect(toggle).toBeInTheDocument()
  })

  it('theme toggle button is focusable', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: /switch to/i })
    toggle.focus()
    expect(toggle).toHaveFocus()
  })
})
