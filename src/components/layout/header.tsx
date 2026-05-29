import { motion, useReducedMotion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

export function Header() {
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const reduce = useReducedMotion()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function handleToggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  const navLink = (to: string, label: string, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      aria-current={location.pathname === to ? 'page' : undefined}
      className={({ isActive }) =>
        cn(
          'text-sm transition-colors duration-150',
          isActive
            ? 'text-[var(--primary)] font-semibold'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )
      }
    >
      {label}
    </NavLink>
  )

  return (
    <header role="banner" className="sticky top-0 z-50 px-4 pt-3 md:pt-4">
      <div
        className="mx-auto flex h-12 w-full max-w-screen-lg items-center justify-between
          rounded-full border border-[var(--border)] bg-[var(--card)]/80 px-4 backdrop-blur-md
          shadow-warm lg:max-w-2xl"
      >
        <Link
          to="/"
          className="group inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight text-[var(--foreground)] transition-opacity duration-150 hover:opacity-80"
          aria-label="gf-vid-chat home"
        >
          <span
            className="size-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_0_4px_var(--glow-primary)]"
            aria-hidden="true"
          />
          gf&#8209;vid&#8209;chat
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-4">
          {navLink('/', 'Home', true)}
          {navLink('/settings', 'Settings')}
        </nav>

        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex size-9 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <motion.span
            key={isDark ? 'sun' : 'moon'}
            initial={reduce ? false : { rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-flex"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </motion.span>
        </button>
      </div>
    </header>
  )
}
