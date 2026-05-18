import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Video, ArrowRight } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MIN_MS = 300_000      // 5 min
const MAX_MS = 7_200_000    // 2 hr
const STEP_MS = 300_000     // 5 min
const DEFAULT_MS = 3_600_000 // 1 hr

function formatDuration(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hr' : `${hours} hr`
}

export function CreateRoom() {
  const [timeoutMs, setTimeoutMs] = useState(DEFAULT_MS)
  const navigate = useNavigate()

  function handleCreate() {
    const roomId = nanoid(10)
    navigate(`/room/${roomId}?role=creator&timeout=${timeoutMs}`)
  }

  const displayValue = formatDuration(timeoutMs)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Video className="size-5 text-[var(--primary)]" aria-hidden="true" />
          Start a Room
        </CardTitle>
        <CardDescription>
          Share the QR code with your partner to connect
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="timeout-slider"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Auto-reconnect timeout
            </label>
            <span
              className="text-sm font-semibold text-[var(--primary)]"
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
            aria-label="Auto-reconnect timeout"
            aria-valuetext={displayValue}
            className="w-full h-2 appearance-none rounded-full cursor-pointer
              bg-[var(--secondary)]
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:size-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[var(--primary)]
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:size-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-[var(--primary)]
              [&::-moz-range-thumb]:border-none
              [&::-moz-range-thumb]:cursor-pointer
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--ring)]
              focus-visible:ring-offset-2"
          />

          <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
            <span>5 min</span>
            <span>2 hr</span>
          </div>
        </div>

        <p className="text-sm text-[var(--muted-foreground)]">
          Reconnects automatically for up to{' '}
          <span className="font-medium text-[var(--foreground)]">
            {displayValue}
          </span>{' '}
          if the connection drops.
        </p>

        <Button
          onClick={handleCreate}
          size="lg"
          className="w-full gap-2"
        >
          Create Room
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}
