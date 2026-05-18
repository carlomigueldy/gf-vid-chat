# gf-vid-chat — Implementation Plan

## Context

A P2P video chat app for a couple to stay connected while sleeping. The key problem: existing apps (Messenger, FaceTime) require ringing and manual acceptance — if one person's internet drops at 3am, they'd have to wake up to reconnect. This app auto-reconnects silently with infinite retries. Connection is established via QR code (no accounts, no servers to maintain). Must be wrappable in one evening.

## Architecture

**Pure client-side SPA** deployed to Vercel. No backend, no database.

- **WebRTC** via **PeerJS** (includes free cloud signaling server at `0.peerjs.com`)
- **QR code** encodes room URL — one creates, other scans/uploads to join
- **Auto-reconnect** with exponential backoff (1s → 30s cap), configurable total timeout (default 1hr)
- **Tech**: Vite + React 19 + TypeScript + ShadcnUI + Tailwind v4 + Framer Motion

### Why PeerJS (not raw WebRTC + Supabase)
- Bundles signaling server — zero backend needed
- Handles SDP exchange, ICE candidates, connection lifecycle
- For 2 users, the free cloud server is sufficient
- Can self-host later if needed (drop-in replacement)

## File Structure

```
src/
├── main.tsx                        # React root + BrowserRouter
├── App.tsx                         # Routes + ThemeProvider + AnimatePresence
├── globals.css                     # Tailwind v4 + shadcn CSS variables
├── components/
│   ├── ui/                         # shadcn primitives (button, card, badge, etc.)
│   ├── layout/
│   │   ├── header.tsx              # Logo + nav + theme toggle
│   │   └── page-container.tsx      # Centered max-w container
│   ├── video/
│   │   ├── video-player.tsx        # <video> with ref, muted/mirror props
│   │   ├── video-grid.tsx          # Full-screen remote + PiP local
│   │   └── connection-status.tsx   # State badge + retry countdown
│   ├── qr/
│   │   ├── qr-display.tsx          # Render QR from room URL (qrcode.react)
│   │   ├── qr-scanner.tsx          # Camera scan (html5-qrcode)
│   │   └── qr-upload.tsx           # File upload + decode (jsQR on canvas)
│   └── room/
│       ├── create-room.tsx         # Create room card + timeout slider
│       ├── join-room.tsx           # Join card with scan/upload/paste tabs
│       └── room-controls.tsx       # Mic/cam toggle, hang up, fullscreen
├── hooks/
│   ├── use-peer.ts                 # PeerJS + auto-reconnect state machine
│   ├── use-media-stream.ts         # getUserMedia + track toggle + cleanup
│   └── use-connection-timer.ts     # Retry timeout countdown
├── context/
│   └── theme-context.tsx           # Light/dark/system with localStorage
├── pages/
│   ├── home-page.tsx               # Create or Join
│   ├── room-page.tsx               # Active video chat
│   └── settings-page.tsx           # Theme + preferences
├── lib/
│   ├── utils.ts                    # cn() helper (shadcn)
│   ├── peer-config.ts              # PeerJS config constants
│   ├── room-id.ts                  # nanoid generation/validation
│   └── qr.ts                       # QR encode/decode helpers
└── types/
    └── index.ts                    # ConnectionState, RoomConfig, Theme
```

Root config: `vite.config.ts`, `tsconfig.json`, `vercel.json`

## Key Packages

| Package | Purpose |
|---------|---------|
| `peerjs` | WebRTC + signaling |
| `qrcode.react` | QR code rendering |
| `html5-qrcode` | Camera QR scanning |
| `jsqr` | QR decode from uploaded image |
| `nanoid` | Room ID generation |
| `framer-motion` | Page transitions + animations |
| `react-router-dom` v7 | Client routing |
| shadcn/ui components | UI primitives |
| `lucide-react` | Icons |

## Core Flows

### QR Connection Flow
1. **Creator** clicks "Create Room" → `nanoid` generates 10-char room ID
2. Navigate to `/room/{id}?role=creator&timeout=3600000`
3. PeerJS creates peer with deterministic ID: `gfvc-{roomId}`
4. Show QR code encoding `https://<deployed-domain>/room/{id}?role=joiner`
5. **Joiner** uploads QR screenshot or scans with camera → extracts URL → navigates
6. Joiner's PeerJS calls creator's known peer ID → auto-connects
7. No ringing, no acceptance — video starts immediately

### Auto-Reconnect State Machine
```
initializing → waiting (creator) / connecting (joiner)
waiting → connecting → connected
connected → reconnecting → connecting → connected  (loop)
reconnecting → timeout  (when retryTimeoutMs exceeded)
any → failed  (unrecoverable: camera denied, etc.)
```

**Backoff**: 1s initial, 2x multiplier, 30s cap. Reset on successful connection.

**Memory safety**: On each retry, `peer.destroy()` the old instance entirely (prevents PeerJS internal state corruption), stop remote stream tracks, clear all timers, then create fresh `Peer`.

**Browser tab sleep**: On `visibilitychange` → `visible`, trigger immediate reconnect (skip backoff).

### Theme System
- Tailwind v4 `@custom-variant dark` with class strategy
- `ThemeProvider` context with `light | dark | system` stored in localStorage
- CSS variables in `:root` (light) and `.dark` (dark)
- Settings page with three-button toggle

### Animations (framer-motion, GPU-only transforms)
- Page transitions: fade + slide up
- QR code reveal: scale spring from center
- Video appear: fade in when stream arrives
- Room controls: slide up from bottom
- Connection status: color pulse when reconnecting
- Cards on home: staggered entrance

## Implementation Phases

### Phase 1 — Scaffold (~20 min)
1. Vite + React 19 + TypeScript template
2. Install all deps (peerjs, qrcode.react, html5-qrcode, jsqr, nanoid, framer-motion, react-router-dom, lucide-react, shadcn utilities)
3. Tailwind v4 via `@tailwindcss/vite` plugin
4. shadcn-style UI components (button, card, badge, slider, switch)
5. Folder structure + `vercel.json` (SPA rewrites)
6. React Router in `App.tsx`

### Phase 2 — Theme + Layout (~15 min)
1. `ThemeProvider` + `useTheme` hook
2. `Header` with logo + theme toggle
3. `PageContainer` wrapper
4. Page shells with route transitions (AnimatePresence)

### Phase 3 — QR Code Flow (~25 min)
1. `room-id.ts` — nanoid generation
2. `CreateRoom` — timeout slider + generate room
3. `QrDisplay` — render QR from URL
4. `QrUpload` — file input → canvas → jsQR decode
5. `QrScanner` — html5-qrcode camera
6. `JoinRoom` — tabs for scan/upload/paste
7. Navigation wiring

### Phase 4 — Core Video Chat (~40 min)
1. `useMediaStream` — camera/mic with toggle and cleanup
2. `usePeer` — the auto-reconnect state machine (hardest piece)
3. `useConnectionTimer` — countdown display
4. `VideoPlayer` + `VideoGrid` — full-screen remote, PiP local
5. `ConnectionStatus` — state badge with retry info
6. `RoomControls` — mute, camera, hangup, fullscreen
7. Wire in `RoomPage`

### Phase 5 — Polish + Deploy (~20 min)
1. Settings page (theme toggle, about)
2. All animations
3. Error states (no camera, connection failed, timeout reached)
4. Mobile responsive
5. `pnpm build` — verify clean
6. Create GitHub public repo, push, deploy to Vercel
7. Test with two devices

## Critical Files (ordered by complexity)

1. `src/hooks/use-peer.ts` — Auto-reconnect state machine. Get this right and everything else follows.
2. `src/pages/room-page.tsx` — Orchestrates usePeer + useMediaStream + all video UI.
3. `src/hooks/use-media-stream.ts` — Camera lifecycle with proper cleanup.
4. `src/components/qr/qr-upload.tsx` — Canvas + jsQR integration for image decode.
5. `src/lib/peer-config.ts` — PeerJS config + STUN server list.

## Deployment

- **Vercel**: Pure static SPA. `vercel.json` with `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`
- **GitHub**: Public repo via `gh repo create gf-vid-chat --public --source=.`
- **HTTPS**: Required for `getUserMedia` — Vercel provides by default
- **No env vars needed** for day-one (PeerJS cloud is free, no keys)

## Verification Checklist

- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm test` passes
- [ ] Create room → QR code displayed
- [ ] Upload QR screenshot → room ID extracted correctly
- [ ] Two browser tabs can video chat
- [ ] Kill one tab → other shows "reconnecting" → reopen tab → auto-reconnects
- [ ] Retry stops after configured timeout
- [ ] Theme toggle works (light/dark/system)
- [ ] Animations are smooth, no jank
- [ ] Vercel deployment is live and accessible
- [ ] Mobile responsive layout works
- [ ] No console errors, no memory leaks in reconnect loop
