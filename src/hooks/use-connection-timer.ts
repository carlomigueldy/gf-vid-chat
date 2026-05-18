import { useEffect, useState } from 'react'

export interface UseConnectionTimerOptions {
  retryTimeoutMs: number
  retryStartTime: number | null
  isActive: boolean
}

export interface UseConnectionTimerReturn {
  timeRemainingMs: number
  isExpired: boolean
  formattedTime: string
}

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useConnectionTimer({
  retryTimeoutMs,
  retryStartTime,
  isActive,
}: UseConnectionTimerOptions): UseConnectionTimerReturn {
  const [timeRemainingMs, setTimeRemainingMs] = useState(retryTimeoutMs)

  useEffect(() => {
    if (!isActive || retryStartTime === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemainingMs(retryTimeoutMs)
      return undefined
    }

    function tick() {
      const elapsed = Date.now() - (retryStartTime as number)
      setTimeRemainingMs(Math.max(0, retryTimeoutMs - elapsed))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isActive, retryStartTime, retryTimeoutMs])

  return {
    timeRemainingMs,
    isExpired: timeRemainingMs <= 0,
    formattedTime: formatMs(timeRemainingMs),
  }
}
