import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { useTheme } from '@/context/theme-context'
import { pageVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { Theme } from '@/types'

const THEME_OPTIONS: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  function handleThemeKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight') {
      const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length]
      setTheme(next.value)
    } else if (e.key === 'ArrowLeft') {
      const prev = THEME_OPTIONS[(index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length]
      setTheme(prev.value)
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 bg-warm-gradient"
    >
      <PageContainer>
        <main>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            Settings
          </h1>

          <section aria-labelledby="appearance-heading">
            <h2
              id="appearance-heading"
              className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3"
            >
              Appearance
            </h2>

            <div
              role="radiogroup"
              aria-label="Theme"
              className="inline-flex rounded-lg border border-[var(--border)] p-1 gap-1 bg-[var(--muted)]"
            >
              {THEME_OPTIONS.map(({ value, label, Icon }, index) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={theme === value}
                  tabIndex={theme === value ? 0 : -1}
                  onClick={() => setTheme(value)}
                  onKeyDown={(e) => handleThemeKeyDown(e, index)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1',
                    theme === value
                      ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="about-heading"
            className="mt-8 pt-6 border-t border-[var(--border)]"
          >
            <h2
              id="about-heading"
              className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3"
            >
              About
            </h2>

            <p className="text-sm font-medium text-[var(--foreground)]">
              gf&#8209;vid&#8209;chat
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Version 1.0.0
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              P2P video for couples · No accounts · No servers
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline underline-offset-4 mt-2 transition-opacity hover:opacity-80"
            >
              View source on GitHub
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </section>
        </main>
      </PageContainer>
    </motion.div>
  )
}
