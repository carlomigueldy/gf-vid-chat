import { useCallback, useState } from 'react'
import { TIMEOUT_DEFAULT_MS } from '@/lib/timeout'
import { TURN_STORAGE_KEY, readCustomTurn } from '@/lib/peer-config'
import type { TurnConfig } from '@/types'

const TIMEOUT_KEY = 'gfvc-default-timeout'
const MIRROR_KEY = 'gfvc-mirror-video'
const WAKE_LOCK_KEY = 'gfvc-keep-screen-awake'
const DEFAULT_MIRROR_VIDEO = true
const DEFAULT_KEEP_SCREEN_AWAKE = true

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : fallback
  } catch {
    return fallback
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

export function usePreferences() {
  const [defaultTimeoutMs, setTimeoutState] = useState(() =>
    readNumber(TIMEOUT_KEY, TIMEOUT_DEFAULT_MS)
  )
  const [mirrorVideo, setMirrorState] = useState(() => readBool(MIRROR_KEY, DEFAULT_MIRROR_VIDEO))
  const [keepScreenAwake, setKeepScreenAwakeState] = useState(() =>
    readBool(WAKE_LOCK_KEY, DEFAULT_KEEP_SCREEN_AWAKE)
  )

  const [turnServer, setTurnState] = useState<TurnConfig | null>(() => readCustomTurn())

  const setTurnServer = useCallback((cfg: TurnConfig | null) => {
    setTurnState(cfg)
    try {
      if (cfg) localStorage.setItem(TURN_STORAGE_KEY, JSON.stringify(cfg))
      else localStorage.removeItem(TURN_STORAGE_KEY)
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  const setDefaultTimeoutMs = useCallback((ms: number) => {
    setTimeoutState(ms)
    try {
      localStorage.setItem(TIMEOUT_KEY, String(ms))
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  const setMirrorVideo = useCallback((on: boolean) => {
    setMirrorState(on)
    try {
      localStorage.setItem(MIRROR_KEY, String(on))
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  const setKeepScreenAwake = useCallback((on: boolean) => {
    setKeepScreenAwakeState(on)
    try {
      localStorage.setItem(WAKE_LOCK_KEY, String(on))
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  return { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo, keepScreenAwake, setKeepScreenAwake, turnServer, setTurnServer }
}
