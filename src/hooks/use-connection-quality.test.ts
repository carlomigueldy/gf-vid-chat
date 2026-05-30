import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useConnectionQuality } from './use-connection-quality'

function makeReport() {
  const m = new Map<string, unknown>()
  m.set('cp', { id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', currentRoundTripTime: 0.05, localCandidateId: 'lc', remoteCandidateId: 'rc' })
  m.set('lc', { id: 'lc', type: 'local-candidate', candidateType: 'relay' })
  m.set('rc', { id: 'rc', type: 'remote-candidate', candidateType: 'srflx' })
  m.set('in', { id: 'in', type: 'inbound-rtp', packetsLost: 0, packetsReceived: 100 })
  return m as unknown as RTCStatsReport
}

describe('useConnectionQuality', () => {
  it('returns unknown when inactive', () => {
    const getPC = vi.fn(() => null)
    const { result } = renderHook(() => useConnectionQuality(getPC, false))
    expect(result.current.quality).toBe('unknown')
    expect(getPC).not.toHaveBeenCalled()
  })

  it('polls getStats and reports quality + relay when active', async () => {
    const pc = { getStats: vi.fn().mockResolvedValue(makeReport()) } as unknown as RTCPeerConnection
    const getPC = () => pc
    const { result } = renderHook(() => useConnectionQuality(getPC, true))
    await waitFor(() => expect(result.current.quality).toBe('good'))
    expect(result.current.isRelayed).toBe(true)
    expect((pc.getStats as ReturnType<typeof vi.fn>)).toHaveBeenCalled()
  })

  it('resets to unknown when it becomes inactive', async () => {
    const pc = { getStats: vi.fn().mockResolvedValue(makeReport()) } as unknown as RTCPeerConnection
    const { result, rerender } = renderHook(
      ({ active }) => useConnectionQuality(() => pc, active),
      { initialProps: { active: true } }
    )
    await waitFor(() => expect(result.current.quality).toBe('good'))
    rerender({ active: false })
    expect(result.current.quality).toBe('unknown')
  })
})
