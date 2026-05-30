import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { RangeSlider } from '@/components/ui/range-slider'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { useTheme } from '@/hooks/use-theme'
import { usePreferences } from '@/hooks/use-preferences'
import { formatDuration } from '@/lib/format'
import { pageVariants } from '@/lib/animations'
import { TIMEOUT_MIN_MS, TIMEOUT_MAX_MS, TIMEOUT_STEP_MS } from '@/lib/timeout'
import type { Theme } from '@/types'
import { TurnSettings } from '@/components/settings/turn-settings'

const THEME_OPTIONS: SegmentedOption<Theme>[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo, keepScreenAwake, setKeepScreenAwake } = usePreferences()

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
              <RangeSlider
                id="default-timeout"
                label="Default auto-reconnect window"
                value={defaultTimeoutMs}
                onChange={setDefaultTimeoutMs}
                min={TIMEOUT_MIN_MS}
                max={TIMEOUT_MAX_MS}
                step={TIMEOUT_STEP_MS}
                formatValue={formatDuration}
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">Used when you start a new room.</p>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="mirror-toggle" className="text-sm font-medium text-[var(--foreground)]">
                Mirror my video
              </label>
              <Switch id="mirror-toggle" aria-label="Mirror my video" checked={mirrorVideo} onCheckedChange={setMirrorVideo} className="ml-4" />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="wake-lock-toggle" className="text-sm font-medium text-[var(--foreground)]">
                Keep screen awake during calls
              </label>
              <Switch
                id="wake-lock-toggle"
                aria-label="Keep screen awake during calls"
                checked={keepScreenAwake}
                onCheckedChange={setKeepScreenAwake}
                className="ml-4"
              />
            </div>
          </Card>

          <TurnSettings />

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
