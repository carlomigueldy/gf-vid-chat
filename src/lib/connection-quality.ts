import type { ConnectionQuality, ConnectionQualityInfo, StatsSample } from '@/types'

interface RawStat {
  id?: string
  type?: string
  currentRoundTripTime?: number
  nominated?: boolean
  selected?: boolean
  state?: string
  localCandidateId?: string
  remoteCandidateId?: string
  candidateType?: string
  packetsLost?: number
  packetsReceived?: number
}

export function assessQuality(rttMs: number | null, lossRatio: number): ConnectionQuality {
  const rtt = rttMs ?? 0
  if (rtt > 500 || lossRatio > 0.05) return 'poor'
  if (rtt > 250 || lossRatio > 0.02) return 'fair'
  return 'good'
}

export function summarizeStats(
  report: RTCStatsReport,
  prev: StatsSample | null
): { info: ConnectionQualityInfo; sample: StatsSample | null } {
  const stats: RawStat[] = []
  const byId = new Map<string, RawStat>()
  report.forEach((value) => {
    const s = value as unknown as RawStat
    stats.push(s)
    if (s.id) byId.set(s.id, s)
  })

  let rttMs: number | null = null
  let isRelayed = false
  let packetsLost = 0
  let packetsReceived = 0
  let haveInbound = false

  for (const s of stats) {
    if (s.type === 'candidate-pair' && (s.nominated || s.selected) && s.state === 'succeeded') {
      if (typeof s.currentRoundTripTime === 'number') rttMs = s.currentRoundTripTime * 1000
      const local = s.localCandidateId ? byId.get(s.localCandidateId) : undefined
      const remote = s.remoteCandidateId ? byId.get(s.remoteCandidateId) : undefined
      if (local?.candidateType === 'relay' || remote?.candidateType === 'relay') isRelayed = true
    }
    if (s.type === 'inbound-rtp') {
      haveInbound = true
      packetsLost += s.packetsLost ?? 0
      packetsReceived += s.packetsReceived ?? 0
    }
  }

  if (!haveInbound) {
    return { info: { quality: 'unknown', isRelayed, rttMs }, sample: prev }
  }

  let lossRatio = 0
  if (prev) {
    const lostDelta = Math.max(0, packetsLost - prev.packetsLost)
    const recvDelta = Math.max(0, packetsReceived - prev.packetsReceived)
    const total = lostDelta + recvDelta
    lossRatio = total > 0 ? lostDelta / total : 0
  }

  return {
    info: { quality: assessQuality(rttMs, lossRatio), isRelayed, rttMs },
    sample: { packetsLost, packetsReceived },
  }
}
