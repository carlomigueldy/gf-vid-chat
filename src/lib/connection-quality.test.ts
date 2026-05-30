import { describe, it, expect } from 'vitest'
import { assessQuality, summarizeStats } from './connection-quality'

function report(entries: Record<string, unknown>[]): RTCStatsReport {
  const m = new Map<string, unknown>()
  entries.forEach((e, i) => m.set((e.id as string) ?? `s${i}`, e))
  return m as unknown as RTCStatsReport
}

describe('assessQuality', () => {
  it('rates good when rtt and loss are low', () => {
    expect(assessQuality(80, 0)).toBe('good')
    expect(assessQuality(200, 0.01)).toBe('good')
  })
  it('rates fair on moderate rtt or loss', () => {
    expect(assessQuality(300, 0)).toBe('fair')
    expect(assessQuality(50, 0.03)).toBe('fair')
  })
  it('rates poor on high rtt or loss', () => {
    expect(assessQuality(600, 0)).toBe('poor')
    expect(assessQuality(50, 0.08)).toBe('poor')
  })
  it('treats null rtt as 0', () => {
    expect(assessQuality(null, 0)).toBe('good')
  })
})

describe('summarizeStats', () => {
  it('returns unknown when there is no inbound-rtp yet', () => {
    const { info } = summarizeStats(report([{ id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', currentRoundTripTime: 0.05 }]), null)
    expect(info.quality).toBe('unknown')
    expect(info.rttMs).toBe(50)
  })

  it('computes good quality with rtt and no loss on first sample', () => {
    const { info, sample } = summarizeStats(
      report([
        { id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', currentRoundTripTime: 0.08, localCandidateId: 'lc', remoteCandidateId: 'rc' },
        { id: 'lc', type: 'local-candidate', candidateType: 'srflx' },
        { id: 'rc', type: 'remote-candidate', candidateType: 'srflx' },
        { id: 'in', type: 'inbound-rtp', packetsLost: 0, packetsReceived: 100 },
      ]),
      null
    )
    expect(info.quality).toBe('good')
    expect(info.isRelayed).toBe(false)
    expect(sample).toEqual({ packetsLost: 0, packetsReceived: 100 })
  })

  it('detects a relayed connection', () => {
    const { info } = summarizeStats(
      report([
        { id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', currentRoundTripTime: 0.05, localCandidateId: 'lc', remoteCandidateId: 'rc' },
        { id: 'lc', type: 'local-candidate', candidateType: 'relay' },
        { id: 'rc', type: 'remote-candidate', candidateType: 'srflx' },
        { id: 'in', type: 'inbound-rtp', packetsLost: 0, packetsReceived: 10 },
      ]),
      null
    )
    expect(info.isRelayed).toBe(true)
  })

  it('computes loss ratio from the delta vs the previous sample', () => {
    const prev = { packetsLost: 10, packetsReceived: 100 }
    const { info } = summarizeStats(
      report([
        { id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', currentRoundTripTime: 0.05 },
        { id: 'in', type: 'inbound-rtp', packetsLost: 20, packetsReceived: 110 }, // +10 lost, +10 recv → 50% loss
      ]),
      prev
    )
    expect(info.quality).toBe('poor')
  })
})
