import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { badgePop } from '@/lib/animations'
import type { ConnectionState } from '@/types'

interface ConnectionStatusProps {
  state: ConnectionState
  retryCount?: number
  timeRemainingMs?: number
}

interface StateConfig {
  icon: React.ComponentType<{ className?: string }>
  text: string
  colorClasses: string
  pulse?: boolean
  spin?: boolean
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const STATE_CONFIG: Record<ConnectionState, StateConfig> = {
  initializing: {
    icon: Loader2,
    text: 'Initializing…',
    colorClasses: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    spin: true,
  },
  waiting: {
    icon: Clock,
    text: 'Waiting for partner…',
    colorClasses: 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    pulse: true,
  },
  connecting: {
    icon: Loader2,
    text: 'Connecting…',
    colorClasses: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    spin: true,
  },
  connected: {
    icon: CheckCircle2,
    text: 'Connected',
    colorClasses: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  reconnecting: {
    icon: RefreshCw,
    text: 'Reconnecting…',
    colorClasses: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    spin: true,
    pulse: true,
  },
  failed: {
    icon: XCircle,
    text: 'Connection lost',
    colorClasses: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
  timeout: {
    icon: Clock,
    text: 'Session ended',
    colorClasses: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
}

export function ConnectionStatus({
  state,
  retryCount = 0,
  timeRemainingMs = 0,
}: ConnectionStatusProps) {
  const [lastState, setLastState] = useState(state)
  const [hidden, setHidden] = useState(false)

  // Reset hidden when state changes (no setState-in-effect)
  if (state !== lastState) {
    setLastState(state)
    setHidden(false)
  }

  // Auto-hide 3s after connected
  useEffect(() => {
    if (state !== 'connected') return undefined
    const timer = setTimeout(() => setHidden(true), 3000)
    return () => clearTimeout(timer)
  }, [state])

  const config = STATE_CONFIG[state]
  const { icon: Icon, spin, pulse } = config

  const displayText =
    state === 'reconnecting' && retryCount > 0
      ? `${config.text} (attempt ${retryCount})`
      : config.text

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={displayText}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
    >
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key={state}
            variants={badgePop}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              backdrop-blur-sm border ${config.colorClasses} ${pulse ? 'animate-pulse-slow' : ''}`}
          >
            <Icon
              className={`size-3 ${spin ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {displayText}
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'reconnecting' && timeRemainingMs > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-[var(--muted-foreground)]"
        >
          Session ends in {formatTime(timeRemainingMs)}
        </motion.p>
      )}
    </div>
  )
}
