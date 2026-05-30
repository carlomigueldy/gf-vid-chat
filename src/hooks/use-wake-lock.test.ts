import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWakeLock } from './use-wake-lock'

function installWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined)
  let releaseHandler: (() => void) | null = null
  const sentinel = {
    release,
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'release') releaseHandler = cb
    }),
    removeEventListener: vi.fn(),
    released: false,
    type: 'screen' as const,
  }
  const request = vi.fn().mockResolvedValue(sentinel)
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, release, sentinel, fireRelease: () => releaseHandler?.() }
}

afterEach(() => {
  // @ts-expect-error test cleanup of the mocked API
  delete navigator.wakeLock
  vi.restoreAllMocks()
})

describe('useWakeLock', () => {
  it('requests a screen wake lock when active', async () => {
    const { request } = installWakeLock()
    await act(async () => {
      renderHook(() => useWakeLock(true))
    })
    expect(request).toHaveBeenCalledWith('screen')
  })

  it('does not request when inactive', async () => {
    const { request } = installWakeLock()
    await act(async () => {
      renderHook(() => useWakeLock(false))
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('releases the lock when it becomes inactive', async () => {
    const { release } = installWakeLock()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })
    await act(async () => {}) // let acquire() resolve and store the sentinel
    await act(async () => {
      rerender({ active: false })
    })
    expect(release).toHaveBeenCalled()
  })

  it('releases the lock on unmount', async () => {
    const { release } = installWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await act(async () => {}) // let acquire() resolve
    await act(async () => {
      unmount()
    })
    expect(release).toHaveBeenCalled()
  })

  it('no-ops without throwing when the API is unsupported', () => {
    // @ts-expect-error ensure unsupported
    delete navigator.wakeLock
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })

  it('re-acquires the lock when the page becomes visible again', async () => {
    const { request, fireRelease } = installWakeLock()
    renderHook(() => useWakeLock(true))
    await act(async () => {}) // initial acquire resolves, sentinel stored
    expect(request).toHaveBeenCalledTimes(1)
    // browser auto-releases the lock when the page is hidden
    await act(async () => {
      fireRelease()
    })
    // page returns to the foreground
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(request).toHaveBeenCalledTimes(2)
  })
})
