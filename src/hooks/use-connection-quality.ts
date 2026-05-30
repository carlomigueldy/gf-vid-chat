import { useEffect, useRef, useState } from 'react'
import { summarizeStats } from '@/lib/connection-quality'
import type { ConnectionQualityInfo, StatsSample } from '@/types'

const POLL_INTERVAL_MS = 2000
const UNKNOWN: ConnectionQualityInfo = { quality: 'unknown', isRelayed: false, rttMs: null }

/**
 * Polls RTCPeerConnection.getStats() while `active` and reports a derived
 * connection-quality reading. `getPeerConnection` should be stable.
 */
export function useConnectionQuality(
  getPeerConnection: () => RTCPeerConnection | null,
  active: boolean
): ConnectionQualityInfo {
  const [info, setInfo] = useState<ConnectionQualityInfo>(UNKNOWN)
  const prevSampleRef = useRef<StatsSample | null>(null)

  useEffect(() => {
    if (!active) {
      prevSampleRef.current = null
      setInfo(UNKNOWN)
      return
    }
    let cancelled = false

    async function poll() {
      const pc = getPeerConnection()
      if (!pc) return
      try {
        const report = await pc.getStats()
        if (cancelled) return
        const { info: next, sample } = summarizeStats(report, prevSampleRef.current)
        prevSampleRef.current = sample
        setInfo(next)
      } catch {
        // stats unavailable — keep the previous reading
      }
    }

    void poll()
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [active, getPeerConnection])

  return info
}
