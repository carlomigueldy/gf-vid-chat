# Connection Quality Indicator — Design

**Date:** 2026-05-30
**Status:** Approved (self-approved per user delegation)
**Scope:** Show a small live call-quality indicator (signal strength + relay state) during an active call, derived from `RTCPeerConnection.getStats()`. Pairs with the just-shipped TURN feature — a couple who adds a relay can see the call is healthy and whether it's being relayed.

## Problem
The app shows connection *state* (connecting/connected/reconnecting) but not connection *quality*. During the awake setup and conversation moments, a couple can't tell a healthy call from a degrading one, or whether their TURN relay is actually in use.

## Design

**Data source.** PeerJS's `MediaConnection` exposes the underlying `RTCPeerConnection`. `usePeer` gains one **purely additive** return value — `getPeerConnection(): RTCPeerConnection | null` (reads `callRef.current?.peerConnection`). No reducer/state-machine change.

**Pure assessment** (`src/lib/connection-quality.ts`): `summarizeStats(report, prevSample)` parses an `RTCStatsReport` into `{ info: ConnectionQualityInfo, sample }`:
- RTT from the nominated `candidate-pair` (`currentRoundTripTime` × 1000).
- Loss ratio from `inbound-rtp` `packetsLost`/`packetsReceived` deltas vs the previous sample.
- `isRelayed` when the selected pair's local/remote candidate `candidateType === 'relay'`.
- `assessQuality(rttMs, lossRatio)`: poor if RTT > 500ms or loss > 5%; fair if RTT > 250ms or loss > 2%; otherwise good; `unknown` when no data yet.

**Polling hook** (`src/hooks/use-connection-quality.ts`): `useConnectionQuality(getPeerConnection, active)` polls every 2s while `active`, threads the previous sample through a ref, and returns the latest `ConnectionQualityInfo`. Resets to `unknown` when inactive; cleans up its interval.

**UI** (`src/components/video/connection-quality.tsx`): a small glass pill, top-right of the call, with a lucide signal icon colored by quality (green/amber/red) and a "Relay" chip when relayed. Hidden when `quality === 'unknown'`. `aria-label` announces the quality. Wired in `room-page.tsx`, shown only while `connected`.

**Types** (`src/types/index.ts`): `ConnectionQuality = 'good' | 'fair' | 'poor' | 'unknown'`; `ConnectionQualityInfo { quality; isRelayed: boolean; rttMs: number | null }`; `StatsSample { packetsLost; packetsReceived }`.

## Testing
- `connection-quality.test.ts`: `assessQuality` thresholds; `summarizeStats` with fake `RTCStatsReport` Maps (good/fair/poor; relayed detection; first-sample `unknown`/no-prev).
- `use-connection-quality.test.ts`: fake timers + mocked `getPeerConnection`/`getStats` → state advances to the computed quality; resets when inactive.
- `connection-quality.test.tsx`: renders the right icon/label per quality; hidden when unknown; shows Relay chip.
- Existing 110 unit + 21 e2e stay green; `use-peer` change is additive (one getter).

## Out of scope
Historical graphs, bitrate adaptation, per-track breakdowns, notifications.

## Acceptance
- [ ] `usePeer` returns `getPeerConnection`; no state-machine change.
- [ ] Quality computed from real getStats fields; relayed detection works.
- [ ] Indicator visible only when connected; hidden when unknown; a11y label present.
- [ ] `type-check`/`lint`/`test`/`build`/`e2e` green; deployed live.
