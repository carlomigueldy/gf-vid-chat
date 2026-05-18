import { Moon, Sun } from 'lucide-react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-context'
import { cn } from '@/lib/utils'

export function Header() {
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function handleToggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header role="banner" className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-screen-lg mx-auto w-full">
        <Link
          to="/"
          className="font-semibold text-base tracking-tight text-[var(--foreground)] hover:opacity-80 transition-opacity duration-150"
          aria-label="gf-vid-chat home"
        >
          gf&#8209;vid&#8209;chat
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-4">
          <NavLink
            to="/"
            end
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className={({ isActive }) =>
              cn(
                'text-sm transition-colors duration-150',
                isActive
                  ? 'text-[var(--foreground)] font-medium'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/settings"
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
            className={({ isActive }) =>
              cn(
                'text-sm transition-colors duration-150',
                isActive
                  ? 'text-[var(--foreground)] font-medium'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )
            }
          >
            Settings
          </NavLink>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleTheme}
          className="rounded-full"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  )
}
