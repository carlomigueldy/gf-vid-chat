import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreferences } from './use-preferences'

describe('usePreferences', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to 1 hr timeout and mirror on', () => {
    const { result } = renderHook(() => usePreferences())
    expect(result.current.defaultTimeoutMs).toBe(3_600_000)
    expect(result.current.mirrorVideo).toBe(true)
  })

  it('persists the default timeout to localStorage', () => {
    const { result } = renderHook(() => usePreferences())
    act(() => result.current.setDefaultTimeoutMs(600_000))
    expect(result.current.defaultTimeoutMs).toBe(600_000)
    expect(localStorage.getItem('gfvc-default-timeout')).toBe('600000')
  })

  it('persists the mirror toggle to localStorage', () => {
    const { result } = renderHook(() => usePreferences())
    act(() => result.current.setMirrorVideo(false))
    expect(result.current.mirrorVideo).toBe(false)
    expect(localStorage.getItem('gfvc-mirror-video')).toBe('false')
  })

  it('reads existing values from localStorage', () => {
    localStorage.setItem('gfvc-default-timeout', '1800000')
    localStorage.setItem('gfvc-mirror-video', 'false')
    const { result } = renderHook(() => usePreferences())
    expect(result.current.defaultTimeoutMs).toBe(1_800_000)
    expect(result.current.mirrorVideo).toBe(false)
  })

  it('falls back to default when localStorage contains an invalid number', () => {
    localStorage.setItem('gfvc-default-timeout', 'NaN')
    const { result } = renderHook(() => usePreferences())
    expect(result.current.defaultTimeoutMs).toBe(3_600_000)
  })

  it('defaults keepScreenAwake to true and persists changes', () => {
    const { result } = renderHook(() => usePreferences())
    expect(result.current.keepScreenAwake).toBe(true)
    act(() => result.current.setKeepScreenAwake(false))
    expect(result.current.keepScreenAwake).toBe(false)
    expect(localStorage.getItem('gfvc-keep-screen-awake')).toBe('false')
  })

  it('defaults turnServer to null, persists it, and clears it', () => {
    const { result } = renderHook(() => usePreferences())
    expect(result.current.turnServer).toBeNull()
    act(() => result.current.setTurnServer({ urls: 'turn:x:3478', username: 'u', credential: 'p' }))
    expect(result.current.turnServer).toEqual({ urls: 'turn:x:3478', username: 'u', credential: 'p' })
    expect(JSON.parse(localStorage.getItem('gfvc-turn')!)).toEqual({ urls: 'turn:x:3478', username: 'u', credential: 'p' })
    act(() => result.current.setTurnServer(null))
    expect(result.current.turnServer).toBeNull()
    expect(localStorage.getItem('gfvc-turn')).toBeNull()
  })

  it('reads an existing turn config from localStorage', () => {
    localStorage.setItem('gfvc-turn', JSON.stringify({ urls: 'turn:y:3478' }))
    const { result } = renderHook(() => usePreferences())
    expect(result.current.turnServer).toEqual({ urls: 'turn:y:3478' })
  })
})
