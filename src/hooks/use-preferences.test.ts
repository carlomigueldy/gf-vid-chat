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
})
