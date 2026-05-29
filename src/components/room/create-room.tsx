import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePreferences } from '@/hooks/use-preferences'

const MIN_MS = 300_000   // 5 min
const MAX_MS = 7_200_000 // 2 hr
const STEP_MS = 300_000  // 5 min

function formatDuration(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hr' : `${hours} hr`
}

export function CreateRoom() {
  const { defaultTimeoutMs } = usePreferences()
  const [timeoutMs, setTimeoutMs] = useState(defaultTimeoutMs)
  const navigate = useNavigate()

  function handleCreate() {
    const roomId = nanoid(10)
    navigate(`/room/${roomId}?role=creator&timeout=${timeoutMs}`)
  }

  const displayValue = formatDuration(timeoutMs)
  const pct = ((timeoutMs - MIN_MS) / (MAX_MS - MIN_MS)) * 100

  return (
    <Card className="p-6 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="timeout-slider" className="text-sm font-medium text-[var(--foreground)]">
            Auto-reconnect for
          </label>
          <span
            className="font-display text-sm font-semibold text-[var(--primary)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {displayValue}
          </span>
        </div>

        <input
          id="timeout-slider"
          type="range"
          min={MIN_MS}
          max={MAX_MS}
          step={STEP_MS}
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
          aria-valuetext={displayValue}
          style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--secondary) ${pct}%)` }}
          className="w-full h-2.5 appearance-none rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:shadow-warm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        />

        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1.5">
          <span>5 min</span>
          <span>2 hr</span>
        </div>
      </div>

      <p className="text-sm text-[var(--muted-foreground)] text-center text-balance">
        If the connection drops, we keep quietly retrying for up to{' '}
        <span className="font-medium text-[var(--foreground)]">{displayValue}</span>.
      </p>

      <Button onClick={handleCreate} size="lg" className="w-full">
        Create Room <span aria-hidden="true">✨</span>
      </Button>
    </Card>
  )
}
