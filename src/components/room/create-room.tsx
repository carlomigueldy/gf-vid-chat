import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RangeSlider } from '@/components/ui/range-slider'
import { usePreferences } from '@/hooks/use-preferences'
import { formatDuration } from '@/lib/format'
import { TIMEOUT_MIN_MS, TIMEOUT_MAX_MS, TIMEOUT_STEP_MS } from '@/lib/timeout'

export function CreateRoom() {
  const { defaultTimeoutMs } = usePreferences()
  const [timeoutMs, setTimeoutMs] = useState(defaultTimeoutMs)
  const navigate = useNavigate()

  function handleCreate() {
    const roomId = nanoid(10)
    navigate(`/room/${roomId}?role=creator&timeout=${timeoutMs}`)
  }

  return (
    <Card className="p-6 space-y-5">
      <RangeSlider
        id="timeout-slider"
        label="Auto-reconnect for"
        value={timeoutMs}
        onChange={setTimeoutMs}
        min={TIMEOUT_MIN_MS}
        max={TIMEOUT_MAX_MS}
        step={TIMEOUT_STEP_MS}
        formatValue={formatDuration}
        minLabel="5 min"
        maxLabel="2 hr"
      />

      <p className="text-sm text-[var(--muted-foreground)] text-center text-balance">
        If the connection drops, we keep quietly retrying for up to{' '}
        <span className="font-medium text-[var(--foreground)]">{formatDuration(timeoutMs)}</span>.
      </p>

      <Button onClick={handleCreate} size="lg" className="w-full">
        Create Room <span aria-hidden="true">✨</span>
      </Button>
    </Card>
  )
}
