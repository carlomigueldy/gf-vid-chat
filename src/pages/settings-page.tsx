import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { useTheme } from '@/hooks/use-theme'
import { usePreferences } from '@/hooks/use-preferences'
import { formatDuration } from '@/lib/format'
import { pageVariants } from '@/lib/animations'
import type { Theme } from '@/types'

const THEME_OPTIONS: SegmentedOption<Theme>[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

const MIN_MS = 300_000
const MAX_MS = 7_200_000
const STEP_MS = 300_000

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo } = usePreferences()
  const pct = ((defaultTimeoutMs - MIN_MS) / (MAX_MS - MIN_MS)) * 100

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 bg-warm-gradient">
      <PageContainer className="max-w-xl">
        <main className="space-y-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h1>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Appearance</h2>
            <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={setTheme} ariaLabel="Theme" layoutId="theme-thumb" />
          </Card>

          <Card className="space-y-5 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Defaults</h2>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="default-timeout" className="text-sm font-medium text-[var(--foreground)]">
                  Default auto-reconnect window
                </label>
                <span className="font-display text-sm font-semibold text-[var(--primary)]" aria-live="polite">
                  {formatDuration(defaultTimeoutMs)}
                </span>
              </div>
              <input
                id="default-timeout"
                type="range"
                min={MIN_MS}
                max={MAX_MS}
                step={STEP_MS}
                value={defaultTimeoutMs}
                onChange={(e) => setDefaultTimeoutMs(Number(e.target.value))}
                aria-label="Default auto-reconnect window"
                aria-valuetext={formatDuration(defaultTimeoutMs)}
                style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--secondary) ${pct}%)` }}
                className="w-full h-2.5 appearance-none rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:shadow-warm [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">Used when you start a new room.</p>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="mirror-toggle" className="text-sm font-medium text-[var(--foreground)]">
                Mirror my video
              </label>
              <Switch id="mirror-toggle" aria-label="Mirror my video" checked={mirrorVideo} onCheckedChange={setMirrorVideo} className="ml-4" />
            </div>
          </Card>

          <Card className="space-y-1 p-6">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">About</h2>
            <p className="font-display text-base font-semibold text-[var(--foreground)]">gf&#8209;vid&#8209;chat</p>
            <p className="text-xs text-[var(--muted-foreground)]">Version 1.0.0</p>
            <p className="text-xs text-[var(--muted-foreground)]">P2P video for couples · No accounts · No servers</p>
            <a
              href="https://github.com/carlomigueldy/gf-vid-chat"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
            >
              View source on GitHub
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </Card>
        </main>
      </PageContainer>
    </motion.div>
  )
}
