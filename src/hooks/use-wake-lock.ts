import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake while `active` is true, using the Screen Wake Lock API.
 * Wake locks are auto-released when the page is hidden, so we re-acquire on
 * `visibilitychange` → visible. No-ops gracefully where the API is unsupported
 * or the request is denied (e.g. low battery).
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    if (!('wakeLock' in navigator)) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          await sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null
        })
      } catch {
        // request denied (not visible, low battery, etc.) — ignore
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && sentinelRef.current === null) {
        void acquire()
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel) void sentinel.release().catch(() => {})
    }
  }, [active])
}
