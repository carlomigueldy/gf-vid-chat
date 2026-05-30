# TURN Relay Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TURN relay support to the WebRTC ICE config so calls connect on strict/symmetric-NAT networks, configurable via build-time env vars and a runtime Settings form — no backend, no committed secrets.

**Architecture:** A pure `buildIceServers(envServers, customTurn)` assembles STUN (always) + env TURN + user TURN; a thin `buildPeerConfig()` gathers env (`import.meta.env`) + localStorage (`gfvc-turn`) and is called at peer creation in `use-peer.ts` (one-line swap). The Settings page gets a "Connectivity" card (a focused `TurnSettings` component) that reads/writes the relay via `usePreferences`.

**Tech Stack:** React 19, TypeScript, PeerJS, Vitest + Testing Library. localStorage for runtime config; Vite `VITE_*` env for build-time config.

**Spec:** `docs/superpowers/specs/2026-05-30-turn-relay-support-design.md`
**Branch:** `feat/turn-support` (already created, off `main`).

---

## Conventions
- **Commit author:** `git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "..."`. NEVER add Co-Authored-By / AI attribution.
- Conventional commits. Run `pnpm type-check && pnpm lint` before each commit; `pnpm test` when a tested unit changes.
- **Shared key:** the localStorage key `gfvc-turn` is defined ONCE as `TURN_STORAGE_KEY` in `peer-config.ts` and imported by `usePreferences` — do not hardcode it in two places.

---

## File Structure
- `src/types/index.ts` — add `TurnConfig`.
- `src/lib/peer-config.ts` — `STUN_SERVERS`, `TURN_STORAGE_KEY`, `parseEnvTurnServers`, `buildIceServers`, `buildPeerConfig`.
- `src/lib/peer-config.test.ts` — new (parser + builder).
- `src/hooks/use-peer.ts` — swap static config for `buildPeerConfig()` at peer creation.
- `src/hooks/use-preferences.ts` (+ `.test.ts`) — `turnServer` / `setTurnServer`.
- `src/components/settings/turn-settings.tsx` (+ `.test.tsx`) — the Connectivity form.
- `src/pages/settings-page.tsx` (+ `.test.tsx`) — render `<TurnSettings />`.
- `.env.example` — new. `README.md` — TURN setup.

---

### Task 1: TurnConfig type + peer-config builders (TDD)

**Files:** Modify `src/types/index.ts`; Modify `src/lib/peer-config.ts`; Create `src/lib/peer-config.test.ts`

- [ ] **Step 1: Add the `TurnConfig` type**

Append to `src/types/index.ts`:
```ts
export interface TurnConfig {
  urls: string
  username?: string
  credential?: string
}
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/peer-config.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseEnvTurnServers, buildIceServers } from './peer-config'

describe('parseEnvTurnServers', () => {
  it('returns [] when no TURN urls are set', () => {
    expect(parseEnvTurnServers({})).toEqual([])
    expect(parseEnvTurnServers({ VITE_TURN_URLS: '' })).toEqual([])
    expect(parseEnvTurnServers({ VITE_TURN_URLS: '   ' })).toEqual([])
  })

  it('parses a comma-separated url list with credentials', () => {
    expect(
      parseEnvTurnServers({
        VITE_TURN_URLS: 'turn:a.example:3478, turns:a.example:5349',
        VITE_TURN_USERNAME: 'user',
        VITE_TURN_CREDENTIAL: 'pass',
      })
    ).toEqual([
      { urls: ['turn:a.example:3478', 'turns:a.example:5349'], username: 'user', credential: 'pass' },
    ])
  })

  it('omits credentials when not provided', () => {
    expect(parseEnvTurnServers({ VITE_TURN_URLS: 'turn:a:3478' })).toEqual([{ urls: ['turn:a:3478'] }])
  })
})

describe('buildIceServers', () => {
  it('always includes the five STUN servers', () => {
    const out = buildIceServers([], null)
    expect(out).toHaveLength(5)
    expect(out.every((s) => String(s.urls).startsWith('stun:'))).toBe(true)
  })

  it('appends env TURN servers', () => {
    const out = buildIceServers([{ urls: ['turn:a:3478'], username: 'u', credential: 'p' }], null)
    expect(out).toHaveLength(6)
    expect(out).toContainEqual({ urls: ['turn:a:3478'], username: 'u', credential: 'p' })
  })

  it('appends a custom TURN server', () => {
    const out = buildIceServers([], { urls: 'turn:b:3478', username: 'x', credential: 'y' })
    expect(out).toContainEqual({ urls: 'turn:b:3478', username: 'x', credential: 'y' })
  })

  it('ignores a custom TURN with blank urls', () => {
    expect(buildIceServers([], { urls: '   ' })).toHaveLength(5)
  })

  it('de-duplicates identical env and custom TURN', () => {
    const out = buildIceServers([{ urls: ['turn:c:3478'], username: 'u' }], { urls: 'turn:c:3478', username: 'u' })
    expect(out.filter((s) => String(s.urls).includes('turn:c'))).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test src/lib/peer-config.test.ts`
Expected: FAIL — `parseEnvTurnServers` / `buildIceServers` not exported.

- [ ] **Step 4: Implement the builders**

Replace the entire `src/lib/peer-config.ts` with:
```ts
import type { PeerOptions } from 'peerjs'
import type { TurnConfig } from '@/types'

export const INITIAL_BACKOFF_MS = 1000
export const MAX_BACKOFF_MS = 30000
export const BACKOFF_MULTIPLIER = 2
export const DEFAULT_RETRY_TIMEOUT_MS = 3_600_000
export const PEER_ID_PREFIX = 'gfvc-'

/** localStorage key for a user-configured TURN relay (single source of truth). */
export const TURN_STORAGE_KEY = 'gfvc-turn'

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
]

/** STUN-only config, kept for back-compat/reference. Runtime uses buildPeerConfig(). */
export const DEFAULT_PEER_CONFIG: PeerOptions = {
  config: { iceServers: STUN_SERVERS },
}

interface TurnEnv {
  VITE_TURN_URLS?: string
  VITE_TURN_USERNAME?: string
  VITE_TURN_CREDENTIAL?: string
}

/** Build TURN ICE servers from Vite env vars. Pure. Returns [] when unset. */
export function parseEnvTurnServers(env: TurnEnv): RTCIceServer[] {
  const urls = (env.VITE_TURN_URLS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
  if (urls.length === 0) return []
  const server: RTCIceServer = { urls }
  if (env.VITE_TURN_USERNAME) server.username = env.VITE_TURN_USERNAME
  if (env.VITE_TURN_CREDENTIAL) server.credential = env.VITE_TURN_CREDENTIAL
  return [server]
}

function iceKey(server: RTCIceServer): string {
  const urls = Array.isArray(server.urls) ? server.urls.join(',') : server.urls
  return `${urls}|${server.username ?? ''}`
}

/** STUN (always) + env TURN + custom TURN, de-duplicated by (urls, username). Pure. */
export function buildIceServers(
  envServers: RTCIceServer[],
  customTurn: TurnConfig | null
): RTCIceServer[] {
  const servers: RTCIceServer[] = [...STUN_SERVERS, ...envServers]
  if (customTurn && customTurn.urls.trim()) {
    const custom: RTCIceServer = { urls: customTurn.urls.trim() }
    if (customTurn.username) custom.username = customTurn.username
    if (customTurn.credential) custom.credential = customTurn.credential
    servers.push(custom)
  }
  const seen = new Set<string>()
  return servers.filter((s) => {
    const key = iceKey(s)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function readCustomTurn(): TurnConfig | null {
  try {
    const raw = localStorage.getItem(TURN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TurnConfig
    return parsed && typeof parsed.urls === 'string' ? parsed : null
  } catch {
    return null
  }
}

/** Assemble the live PeerJS config from env + localStorage. Call at peer creation. */
export function buildPeerConfig(): PeerOptions {
  const envServers = parseEnvTurnServers(import.meta.env as unknown as TurnEnv)
  return { config: { iceServers: buildIceServers(envServers, readCustomTurn()) } }
}

export function buildPeerId(roomId: string): string {
  return `${PEER_ID_PREFIX}${roomId}`
}

export function calculateBackoff(attempt: number): number {
  const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt)
  return Math.min(backoff, MAX_BACKOFF_MS)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/lib/peer-config.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/peer-config.ts src/lib/peer-config.test.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add TURN-aware ICE server builders to peer-config"
```

---

### Task 2: Use the dynamic config in use-peer

**Files:** Modify `src/hooks/use-peer.ts`

- [ ] **Step 1: Swap the static config for `buildPeerConfig()`**

In `src/hooks/use-peer.ts`, in the import from `@/lib/peer-config`, replace the imported `DEFAULT_PEER_CONFIG` identifier with `buildPeerConfig` (keep `PEER_ID_PREFIX` and any others). Then replace the peer-creation block:
```ts
    const peerId = role === 'creator' ? `${PEER_ID_PREFIX}${roomId}` : undefined
    const peer = peerId
      ? new Peer(peerId, DEFAULT_PEER_CONFIG)
      : new Peer(DEFAULT_PEER_CONFIG)
```
with:
```ts
    const peerId = role === 'creator' ? `${PEER_ID_PREFIX}${roomId}` : undefined
    const peerConfig = buildPeerConfig()
    const peer = peerId
      ? new Peer(peerId, peerConfig)
      : new Peer(peerConfig)
```

- [ ] **Step 2: Verify use-peer tests still pass**

Run: `pnpm test src/hooks/use-peer.test.ts`
Expected: PASS. In jsdom `buildPeerConfig()` yields the same 5-STUN config (no `VITE_TURN_*`, no `gfvc-turn`), so behavior is unchanged. If a test asserts reference-equality with `DEFAULT_PEER_CONFIG`, change it to assert the passed config's `config.iceServers` has length 5 / contains a `stun:` url instead.

- [ ] **Step 3: Full check + commit**

Run: `pnpm type-check && pnpm lint && pnpm test`
```bash
git add src/hooks/use-peer.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: build peer ICE config (incl. TURN) at connect time"
```

---

### Task 3: turnServer preference (TDD)

**Files:** Modify `src/hooks/use-preferences.ts`; Modify `src/hooks/use-preferences.test.ts`

- [ ] **Step 1: Add the failing tests**

Append inside the `describe('usePreferences', ...)` block in `src/hooks/use-preferences.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test src/hooks/use-preferences.test.ts`
Expected: FAIL — `turnServer`/`setTurnServer` undefined.

- [ ] **Step 3: Implement**

In `src/hooks/use-preferences.ts`: add imports at the top:
```ts
import { TURN_STORAGE_KEY } from '@/lib/peer-config'
import type { TurnConfig } from '@/types'
```
Add a reader near the other `read*` helpers:
```ts
function readTurn(): TurnConfig | null {
  try {
    const raw = localStorage.getItem(TURN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TurnConfig
    return parsed && typeof parsed.urls === 'string' ? parsed : null
  } catch {
    return null
  }
}
```
Inside `usePreferences`, add the state + setter (next to the others):
```ts
  const [turnServer, setTurnState] = useState<TurnConfig | null>(() => readTurn())

  const setTurnServer = useCallback((cfg: TurnConfig | null) => {
    setTurnState(cfg)
    try {
      if (cfg) localStorage.setItem(TURN_STORAGE_KEY, JSON.stringify(cfg))
      else localStorage.removeItem(TURN_STORAGE_KEY)
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])
```
Add `turnServer, setTurnServer` to the returned object:
```ts
  return { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo, keepScreenAwake, setKeepScreenAwake, turnServer, setTurnServer }
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test src/hooks/use-preferences.test.ts`
Expected: PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-preferences.ts src/hooks/use-preferences.test.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: persist a user TURN relay in usePreferences"
```

---

### Task 4: TurnSettings component + Settings wiring (TDD)

**Files:** Create `src/components/settings/turn-settings.tsx`; Create `src/components/settings/turn-settings.test.tsx`; Modify `src/pages/settings-page.tsx`; Modify `src/pages/settings-page.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `src/components/settings/turn-settings.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TurnSettings } from './turn-settings'

describe('TurnSettings', () => {
  beforeEach(() => localStorage.clear())

  it('shows STUN-only status by default', () => {
    render(<TurnSettings />)
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })

  it('saves a valid TURN relay to localStorage and shows configured status', () => {
    render(<TurnSettings />)
    fireEvent.change(screen.getByLabelText('TURN URL'), { target: { value: 'turn:turn.example.com:3478' } })
    fireEvent.change(screen.getByLabelText('TURN username'), { target: { value: 'u' } })
    fireEvent.change(screen.getByLabelText('TURN password'), { target: { value: 'p' } })
    fireEvent.click(screen.getByRole('button', { name: /save relay/i }))
    expect(JSON.parse(localStorage.getItem('gfvc-turn')!)).toEqual({
      urls: 'turn:turn.example.com:3478',
      username: 'u',
      credential: 'p',
    })
    expect(screen.getByText(/relay configured/i)).toBeInTheDocument()
  })

  it('rejects an invalid URL with an alert and does not persist', () => {
    render(<TurnSettings />)
    fireEvent.change(screen.getByLabelText('TURN URL'), { target: { value: 'http://nope' } })
    fireEvent.click(screen.getByRole('button', { name: /save relay/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(localStorage.getItem('gfvc-turn')).toBeNull()
  })

  it('removes a configured relay', () => {
    localStorage.setItem('gfvc-turn', JSON.stringify({ urls: 'turn:x:3478' }))
    render(<TurnSettings />)
    expect(screen.getByText(/relay configured/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(localStorage.getItem('gfvc-turn')).toBeNull()
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test src/components/settings/turn-settings.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `TurnSettings`**

Create `src/components/settings/turn-settings.tsx`:
```tsx
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePreferences } from '@/hooks/use-preferences'

function isValidTurnUrl(url: string): boolean {
  return /^turns?:/.test(url.trim())
}

const inputClass =
  'w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow'

export function TurnSettings() {
  const { turnServer, setTurnServer } = usePreferences()
  const [urls, setUrls] = useState(turnServer?.urls ?? '')
  const [username, setUsername] = useState(turnServer?.username ?? '')
  const [credential, setCredential] = useState(turnServer?.credential ?? '')
  const [error, setError] = useState('')

  const configured = turnServer !== null

  function handleSave() {
    if (!isValidTurnUrl(urls)) {
      setError('Enter a valid TURN URL starting with turn: or turns:')
      return
    }
    setError('')
    setTurnServer({
      urls: urls.trim(),
      username: username.trim() || undefined,
      credential: credential.trim() || undefined,
    })
  }

  function handleRemove() {
    setTurnServer(null)
    setUrls('')
    setUsername('')
    setCredential('')
    setError('')
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Connectivity</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          If a call won't connect on a strict network, add a TURN relay server to fall back to.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="turn-url" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            TURN URL
          </label>
          <input
            id="turn-url"
            type="text"
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value)
              setError('')
            }}
            placeholder="turn:turn.example.com:3478"
            aria-label="TURN URL"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'turn-error' : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="turn-username" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Username
          </label>
          <input
            id="turn-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="optional"
            aria-label="TURN username"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="turn-credential" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="turn-credential"
            type="password"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="optional"
            aria-label="TURN password"
            className={inputClass}
          />
        </div>
        {error && (
          <p id="turn-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave}>Save relay</Button>
        {configured && (
          <Button variant="ghost" onClick={handleRemove}>
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {configured ? 'Relay configured — calls can fall back to it.' : 'No relay — using STUN only.'}
      </p>
    </Card>
  )
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test src/components/settings/turn-settings.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into the Settings page**

In `src/pages/settings-page.tsx`: add the import `import { TurnSettings } from '@/components/settings/turn-settings'`. Render `<TurnSettings />` between the Defaults `</Card>` and the About `<Card ...>` (i.e., directly after the closing tag of the Defaults card, before the About card opens).

- [ ] **Step 6: Add the Settings wiring assertion**

Append to `describe('SettingsPage', ...)` in `src/pages/settings-page.test.tsx`:
```tsx
  it('renders the Connectivity TURN section', () => {
    renderSettings()
    expect(screen.getByLabelText('TURN URL')).toBeInTheDocument()
    expect(screen.getByText(/no relay/i)).toBeInTheDocument()
  })
```

- [ ] **Step 7: Verify + commit**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: green (settings-page +1, turn-settings +4).
```bash
git add src/components/settings/turn-settings.tsx src/components/settings/turn-settings.test.tsx src/pages/settings-page.tsx src/pages/settings-page.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: Settings Connectivity card to configure a TURN relay"
```

---

### Task 5: Docs (.env.example + README) + final verification

**Files:** Create `.env.example`; Modify `README.md`

- [ ] **Step 1: Create `.env.example`**

```
# Optional TURN relay for strict-NAT / symmetric-NAT connectivity.
# Comma-separate multiple URLs. Leave unset for STUN-only (the default).
# Free options: Cloudflare TURN, metered.ca, or self-host coturn.
# These are build-time vars (set them in Vercel project env for production).
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

- [ ] **Step 2: Update the README STUN/TURN section**

In `README.md`, replace the `### STUN / TURN` subsection body with:
```markdown
### STUN / TURN

Calls use Google's public **STUN** servers by default. If both peers are behind symmetric NAT or a restrictive firewall, a direct/STUN path can fail — add a **TURN** relay to fall back to. Two ways, no backend or code change needed:

- **In the app:** Settings → **Connectivity** → enter your TURN URL + username + password. Stored locally in the browser, applied on the next (re)connect.
- **At build/deploy:** set `VITE_TURN_URLS` (comma-separated), `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` (e.g. in Vercel project env). See `.env.example`.

Get free TURN credentials from Cloudflare TURN, metered.ca, or self-host [coturn](https://github.com/coturn/coturn). TURN is never committed to the repo.
```

- [ ] **Step 3: Final verification loop**

Run, in order (all must pass):
```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```
Expected: all green (≈101 unit tests across ~19 files; 21 e2e).

- [ ] **Step 4: Commit**

```bash
git add .env.example README.md
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "docs: document TURN relay configuration"
```

---

## Self-Review

**Spec coverage:** `TurnConfig` → T1; `buildIceServers`/`parseEnvTurnServers`/`buildPeerConfig`/`STUN_SERVERS` → T1; dedupe → T1; `use-peer` swap → T2; `turnServer` preference + `gfvc-turn` single-key (`TURN_STORAGE_KEY`) → T1 (key) + T3; Settings Connectivity card + validation + remove + status → T4; `.env.example` + README → T5; STUN-only no-regression → T2 (use-peer tests) + T1 (`buildIceServers([], null)`); verification → T5. All spec sections mapped.

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `TurnConfig { urls: string; username?; credential? }` used identically in peer-config, usePreferences, and TurnSettings. `TURN_STORAGE_KEY = 'gfvc-turn'` defined once in peer-config and imported by usePreferences; tests assert the literal `gfvc-turn`. `buildIceServers(RTCIceServer[], TurnConfig | null)` and `parseEnvTurnServers(TurnEnv)` signatures match their call sites and tests. `usePreferences()` return adds `turnServer`/`setTurnServer` consumed by `TurnSettings`.
