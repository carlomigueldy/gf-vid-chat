# Connection Quality Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Show a small live call-quality indicator (signal bars + relay state) during a connected call, derived from `RTCPeerConnection.getStats()`.

**Architecture:** A pure `summarizeStats`/`assessQuality` (`connection-quality.ts`) turns a stats report into a `ConnectionQualityInfo`; a `useConnectionQuality` hook polls every 2s; `usePeer` exposes the live `RTCPeerConnection` via an additive `getPeerConnection()` getter (no state-machine change); a `<ConnectionQuality>` pill renders it in the call.

**Tech Stack:** React 19, TS, PeerJS, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-30-connection-quality-design.md` · **Branch:** `feat/connection-quality`

---

## Conventions
- Commit author `git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>"`. No AI attribution. Conventional commits. TDD where a test is specified.

---

### Task 1: Types + pure quality assessment (TDD)

**Files:** Modify `src/types/index.ts`; Create `src/lib/connection-quality.ts`; Create `src/lib/connection-quality.test.ts`

- [ ] **Step 1: Add types** — append to `src/types/index.ts`:
```ts
export type ConnectionQuality = 'good' | 'fair' | 'poor' | 'unknown'

export interface ConnectionQualityInfo {
  quality: ConnectionQuality
  isRelayed: boolean
  rttMs: number | null
}

export interface StatsSample {
  packetsLost: number
  packetsReceived: number
}
```

- [ ] **Step 2: Write the failing test** — create `src/lib/connection-quality.test.ts`:
```ts
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
```

- [ ] **Step 3: Run to verify failure** — `pnpm test src/lib/connection-quality.test.ts` → FAIL (module missing).

- [ ] **Step 4: Implement** — create `src/lib/connection-quality.ts`:
```ts
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
```

- [ ] **Step 5: Run to verify pass** — `pnpm test src/lib/connection-quality.test.ts` → PASS (8 tests).

- [ ] **Step 6: Commit**
```bash
git add src/types/index.ts src/lib/connection-quality.ts src/lib/connection-quality.test.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add pure connection-quality assessment from WebRTC stats"
```

---

### Task 2: Expose the RTCPeerConnection from usePeer

**Files:** Modify `src/hooks/use-peer.ts`

- [ ] **Step 1: Add `getPeerConnection` to the return type** — in `UsePeerReturn` (after `disconnect: () => void`):
```ts
  getPeerConnection: () => RTCPeerConnection | null
```

- [ ] **Step 2: Add the getter and return it** — directly after the existing `disconnect` `useCallback` (near the bottom of the hook), add:
```ts
  const getPeerConnection = useCallback((): RTCPeerConnection | null => {
    return callRef.current?.peerConnection ?? null
  }, [])
```
Then add `getPeerConnection` to the returned object:
```ts
  return {
    remoteStream: state.remoteStream,
    connectionState: state.connectionState,
    retryCount: state.retryCount,
    timeRemainingMs: state.timeRemainingMs,
    disconnect,
    getPeerConnection,
  }
```
(No other change. If TS reports `peerConnection` is possibly-undefined on `MediaConnection`, the `?? null` already handles it.)

- [ ] **Step 3: Verify + commit**
```bash
pnpm type-check && pnpm lint && pnpm test
git add src/hooks/use-peer.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: expose getPeerConnection from usePeer for stats"
```

---

### Task 3: useConnectionQuality polling hook (TDD)

**Files:** Create `src/hooks/use-connection-quality.ts`; Create `src/hooks/use-connection-quality.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/hooks/use-connection-quality.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify failure** — `pnpm test src/hooks/use-connection-quality.test.ts` → FAIL.

- [ ] **Step 3: Implement** — create `src/hooks/use-connection-quality.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify pass** — `pnpm test src/hooks/use-connection-quality.test.ts` → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/hooks/use-connection-quality.ts src/hooks/use-connection-quality.test.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add useConnectionQuality polling hook"
```

---

### Task 4: ConnectionQuality component (TDD) + room wiring

**Files:** Create `src/components/video/connection-quality.tsx`; Create `src/components/video/connection-quality.test.tsx`; Modify `src/pages/room-page.tsx`

- [ ] **Step 1: Write the failing test** — create `src/components/video/connection-quality.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionQuality } from './connection-quality'

describe('ConnectionQuality', () => {
  it('renders a labelled status for a good connection', () => {
    render(<ConnectionQuality info={{ quality: 'good', isRelayed: false, rttMs: 80 }} />)
    expect(screen.getByRole('status', { name: /connection quality: good/i })).toBeInTheDocument()
  })

  it('announces relay and shows a Relay chip when relayed', () => {
    render(<ConnectionQuality info={{ quality: 'poor', isRelayed: true, rttMs: 600 }} />)
    expect(screen.getByRole('status', { name: /connection quality: poor, relayed/i })).toBeInTheDocument()
    expect(screen.getByText('Relay')).toBeInTheDocument()
  })

  it('renders nothing when quality is unknown', () => {
    const { container } = render(<ConnectionQuality info={{ quality: 'unknown', isRelayed: false, rttMs: null }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run to verify failure** — `pnpm test src/components/video/connection-quality.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — create `src/components/video/connection-quality.tsx`:
```tsx
import type { ConnectionQualityInfo } from '@/types'

const LEVELS = {
  good: { level: 3, color: 'bg-green-500', label: 'Good' },
  fair: { level: 2, color: 'bg-yellow-500', label: 'Fair' },
  poor: { level: 1, color: 'bg-red-500', label: 'Poor' },
} as const

export function ConnectionQuality({ info }: { info: ConnectionQualityInfo }) {
  if (info.quality === 'unknown') return null
  const { level, color, label } = LEVELS[info.quality]

  return (
    <div
      role="status"
      aria-label={`Connection quality: ${label}${info.isRelayed ? ', relayed' : ''}`}
      className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[var(--card)]/70 px-3 py-1.5 backdrop-blur-md"
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-sm ${bar <= level ? color : 'bg-white/25'}`}
            style={{ height: `${bar * 4 + 2}px` }}
          />
        ))}
      </span>
      {info.isRelayed && (
        <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
          Relay
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify pass** — `pnpm test src/components/video/connection-quality.test.tsx` → PASS (3 tests).

- [ ] **Step 5: Wire into `room-page.tsx`** — add imports:
```tsx
import { useConnectionQuality } from '@/hooks/use-connection-quality'
import { ConnectionQuality } from '@/components/video/connection-quality'
```
Destructure `getPeerConnection` from `usePeer(...)` (add it to the existing destructure). Then, alongside the other hooks (after `usePeer`, BEFORE the early returns for `mediaError`/`timeout`), add:
```tsx
  const quality = useConnectionQuality(getPeerConnection, connectionState === 'connected')
```
In the main `return` JSX, directly after the `<ConnectionStatus ... />` element, add:
```tsx
      {connectionState === 'connected' && <ConnectionQuality info={quality} />}
```

- [ ] **Step 6: Verify + commit**
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
git add src/components/video/connection-quality.tsx src/components/video/connection-quality.test.tsx src/pages/room-page.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: connection-quality indicator in the call"
```

---

### Task 5: Final verification

- [ ] **Step 1:** Run `pnpm type-check && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` — all green (≈124 unit / 21 e2e).
- [ ] **Step 2:** If any check fails in a way the plan didn't anticipate, STOP and report — do not weaken `use-peer` or reconnect tests.

---

## Self-Review
**Spec coverage:** types → T1; `assessQuality`/`summarizeStats` + relay/loss → T1; `getPeerConnection` additive → T2; polling hook → T3; component + room wiring (connected-only, before early returns) → T4; verification → T5. All mapped.
**Placeholders:** none.
**Type consistency:** `ConnectionQualityInfo { quality; isRelayed; rttMs }` and `StatsSample { packetsLost; packetsReceived }` identical across `connection-quality.ts`, the hook, and the component. `getPeerConnection: () => RTCPeerConnection | null` matches between `UsePeerReturn`, the getter, and the hook's parameter. `summarizeStats(report, prev) → { info, sample }` matches its call site in the hook.
