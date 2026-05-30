# TURN Relay Support — Design

**Date:** 2026-05-30
**Status:** Approved (self-approved per user delegation) — ready for implementation planning
**Scope:** Add TURN relay support to the WebRTC ICE configuration so calls connect on strict/symmetric-NAT networks. Configurable via build-time env vars and a runtime Settings UI. No backend, no secrets committed to the repo.

---

## 1. Context & Problem

gf-vid-chat establishes P2P calls via PeerJS over WebRTC. `src/lib/peer-config.ts` ships only **STUN** servers (5 Google STUN). STUN lets peers discover their public address but cannot relay media when both peers are behind **symmetric NAT** or restrictive firewalls — roughly 10–15% of real-world network pairs. For those couples the call simply never connects, and the auto-reconnect loop retries forever against an unwinnable ICE negotiation.

A **TURN** relay fixes this by relaying media through a server when direct/STUN paths fail. The app has no backend, so TURN credentials must come from outside the repo: build-time environment variables (for the deployer) and/or a runtime Settings form (for the end user). This spec adds that capability end to end.

**Out of scope:** shipping working default TURN credentials (no safe, free, zero-config public TURN exists); a connection-quality/stats indicator (separate concern, low value for a sleeping user); TURN credential minting/rotation (requires a backend).

---

## 2. Decisions

| Decision | Choice |
|---|---|
| Config sources | Build-time env (`VITE_TURN_*`) **and** runtime Settings UI (localStorage) — merged |
| Default when unconfigured | STUN-only (today's behavior) — no regression |
| ICE assembly | Pure `buildIceServers(envServers, customTurn)` (testable) + thin `buildPeerConfig()` that reads env + localStorage |
| use-peer change | One-line swap of the static config for `buildPeerConfig()` at peer creation — no reconnect-logic change |
| Persistence | `usePreferences` gains `turnServer` (JSON at `gfvc-turn`) — same key `buildPeerConfig` reads |
| Settings UI | New "Connectivity (advanced)" card: URL / username / password, Save + Remove, status line |
| Secrets | Never committed. `.env.example` documents the vars; live activation via Vercel env or the Settings form |

---

## 3. Architecture

### 3.1 `src/types/index.ts`
```ts
export interface TurnConfig {
  urls: string       // e.g. "turn:turn.example.com:3478" (single URL from the UI)
  username?: string
  credential?: string
}
```

### 3.2 `src/lib/peer-config.ts` (additions; keep existing exports)
- `STUN_SERVERS: RTCIceServer[]` — the existing 5 Google STUN entries (extracted constant). `DEFAULT_PEER_CONFIG` stays (STUN-only) for back-compat.
- `parseEnvTurnServers(env): RTCIceServer[]` — pure. Reads `VITE_TURN_URLS` (comma-separated → string[]), `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`. Returns `[]` when no URLs, else a single `RTCIceServer` with the URL array + creds.
- `buildIceServers(envServers: RTCIceServer[], customTurn: TurnConfig | null): RTCIceServer[]` — pure. `[...STUN_SERVERS, ...envServers]`, plus the custom TURN (when `urls` is non-empty after trim). De-duplicates servers by a stable key (urls+username) so an env TURN equal to the custom one isn't added twice.
- `buildPeerConfig(): PeerOptions` — thin, impure shell: `parseEnvTurnServers(import.meta.env)` + `readCustomTurn()` (reads/parses `localStorage['gfvc-turn']`, try/catch → null), returns `{ config: { iceServers: buildIceServers(...) } }`.

### 3.3 `src/hooks/use-peer.ts`
At peer creation (currently `new Peer(peerId, DEFAULT_PEER_CONFIG)` / `new Peer(DEFAULT_PEER_CONFIG)`), build the config fresh: `const peerConfig = buildPeerConfig()` then pass `peerConfig`. Re-reading on each (re)connect means a TURN added mid-session takes effect on the next retry. **No other change to the reconnect state machine.**

### 3.4 `src/hooks/use-preferences.ts`
Add `turnServer: TurnConfig | null` + `setTurnServer(cfg: TurnConfig | null)`. Read via a JSON-parsing helper (try/catch → null) from `gfvc-turn`; `setTurnServer(null)` removes the key, otherwise writes `JSON.stringify(cfg)`. Mirrors the existing preference patterns.

### 3.5 Settings — "Connectivity (advanced)" card (`src/pages/settings-page.tsx`)
A new `<Card>` after Defaults:
- Heading "Connectivity" + helper: "If a call won't connect on a strict network, add a TURN relay server."
- Local controlled inputs (initialized from `turnServer`): TURN URL (`turn:` / `turns:`), Username, Password (`type="password"`).
- **Save relay** button: validates the URL starts with `turn:` or `turns:` (else inline error); on success `setTurnServer({ urls, username, credential })`.
- **Remove** button (only when a relay is saved): `setTurnServer(null)` + clears inputs.
- Status line: "Relay configured — calls can fall back to it" or "No relay — using STUN only".
- A11y: labelled inputs (`htmlFor`/`id`), error via `role="alert"`, buttons with clear names.

### 3.6 `.env.example` (new) + README
`.env.example` documents:
```
# Optional TURN relay for strict-NAT connectivity (comma-separate multiple URLs).
# Leave unset for STUN-only. Get free credentials from Cloudflare, metered.ca, or self-host coturn.
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```
README: replace the existing "STUN / TURN" subsection with how to enable TURN (env at build/Vercel, or the in-app Settings form) and where to get free credentials.

---

## 4. Testing

- **`src/lib/peer-config.test.ts`** (new):
  - `parseEnvTurnServers`: empty/undefined `VITE_TURN_URLS` → `[]`; comma list → one server with trimmed URL array + creds.
  - `buildIceServers`: STUN always present; env TURN appended; custom TURN appended; identical env+custom deduped to one TURN; whitespace-only custom `urls` ignored.
- **`src/hooks/use-preferences.test.ts`**: `turnServer` defaults to `null`; `setTurnServer({...})` persists JSON to `gfvc-turn`; `setTurnServer(null)` removes it; existing stored JSON is read back.
- **`src/pages/settings-page.test.tsx`**: the Connectivity card renders URL/username/password inputs; saving a valid `turn:` URL persists to `gfvc-turn`; an invalid URL shows an alert and does not persist; Remove clears it.
- Existing 95 tests must stay green. `use-peer` tests must still pass (config swap is behavior-neutral for STUN-only default).

---

## 5. Affected Files
- `src/types/index.ts` — `TurnConfig`.
- `src/lib/peer-config.ts` — STUN constant, parser, builder, `buildPeerConfig`.
- `src/lib/peer-config.test.ts` — new.
- `src/hooks/use-peer.ts` — config swap only.
- `src/hooks/use-preferences.ts` (+ test) — `turnServer`.
- `src/pages/settings-page.tsx` (+ test) — Connectivity card.
- `.env.example` — new.
- `README.md` — TURN setup.

---

## 6. Acceptance Criteria
- [ ] STUN-only default unchanged when nothing is configured (no regression; `use-peer` tests green).
- [ ] `VITE_TURN_*` env, when set at build, adds the TURN server to every peer's ICE config.
- [ ] Settings "Connectivity" card saves/removes a TURN relay; persists to `gfvc-turn`; invalid URL rejected with an alert.
- [ ] A TURN configured via Settings is included on the next (re)connect (verified by `buildIceServers` unit tests + reading the same key in `buildPeerConfig`).
- [ ] `.env.example` + README document both configuration paths.
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test` (≈101 tests), `pnpm build`, `pnpm test:e2e` all green.
- [ ] Deployed to Vercel; live site stays functional (STUN-only) and now exposes the Connectivity settings.
