# gf-vid-chat — UI Design Specifications

## Design Philosophy

**Video-first**: The video call is the hero. During an active call, every UI element recedes — controls auto-hide, status badges are minimal, chrome disappears. The app serves one purpose: keeping two people visually connected.

**Calm by default**: Animations are subtle and purposeful. No flashy effects. Transitions feel natural (150–300ms), not jarring. The reconnect loop is silent — users shouldn't feel anxious during a reconnect.

**Two-person focus**: This app is used by two specific people who trust each other. No sign-in friction. No settings bloat. Get to video in 3 taps max.

---

## Design Direction: Soft + Warm (Design B)

**Chosen by user.** This is the locked visual direction. The palette is warm-tinted — a soft cream background, rose/pink primary accent, and gentle warm-brown neutrals. Dark mode shifts to a rich warm-charcoal, not cold grey.

### Visual Principles
- **Warm, not white**: Every surface has a subtle warm tint (hue ~12–60 in oklch). No pure neutral grey.
- **Rose primary**: All interactive elements — buttons, focus rings, active states — use the rose/pink primary.
- **Larger radius**: `0.75rem` base radius (vs the previous `0.625rem`) — softer, friendlier.
- **Warm shadows**: Use `.shadow-warm`, `.shadow-warm-md`, `.shadow-warm-lg` utilities — not Tailwind's default shadow (which uses pure black). The shadow tokens are defined in `globals.css`.
- **Gradient option**: Apply `.bg-warm-gradient` to the page root for a subtle rose glow at the top of the viewport. Optional — use on home and settings pages, NOT on the room page (video fills the screen).

### Elevated Expression — "Soft & Rounded" (2026-05-30)

The Soft + Warm palette is unchanged. Expression is elevated:

- **Display font:** Fredoka (`font-display`). **Body/UI font:** Plus Jakarta Sans (`--font-sans`). Both self-hosted via `@fontsource`.
- **Buttons** are full **pills** with a rose **gradient** (`--primary-gradient`) and a soft **glow** (`.shadow-glow`).
- **Cards** are `rounded-3xl`, borderless, with warm soft shadows.
- **SegmentedControl** (`src/components/ui/segmented-control.tsx`) is the shared "pick one" primitive: Home Start/Join, Join method, Settings theme.
- **Home** is a **segmented hero** (one toggle swaps Start ⇄ Join in place), not two side-by-side cards.
- **Active call** uses a glassy floating dock, a draggable tap-to-swap PiP, and a **calm breathing reconnect overlay** (never a red full-screen error).
- **Motion** is spring-based and playful but calm; all of it respects `prefers-reduced-motion`.
- **Responsive:** phone-first; content stays in a comfortable centered column (`max-w-md`/`max-w-xl`) and never stretches edge-to-edge on large screens. `100dvh` + safe-area insets on the call.

---

## Design Tokens

All values map directly to CSS variables defined in `src/globals.css`. Never use hardcoded hex values or arbitrary Tailwind values.

### Color Tokens

| Token | Light (oklch) | Dark (oklch) | Tailwind Usage |
|-------|--------------|-------------|----------------|
| `--background` | `0.995 0.002 60` (warm white) | `0.16 0.01 30` (warm charcoal) | `bg-[var(--background)]` |
| `--foreground` | `0.18 0.01 30` (warm near-black) | `0.96 0.005 30` | `text-[var(--foreground)]` |
| `--card` | `1 0.001 60` (warm white card) | `0.21 0.012 30` | `bg-[var(--card)]` |
| `--card-foreground` | `0.18 0.01 30` | `0.96 0.005 30` | `text-[var(--card-foreground)]` |
| `--primary` | `0.65 0.18 12` (**rose/pink**) | `0.72 0.16 12` (lighter rose) | `bg-[var(--primary)]` |
| `--primary-foreground` | `0.99 0.002 60` (warm white) | `0.16 0.01 30` | `text-[var(--primary-foreground)]` |
| `--secondary` | `0.96 0.01 30` (warm light) | `0.27 0.012 30` | `bg-[var(--secondary)]` |
| `--muted` | `0.96 0.008 40` (warm muted) | `0.27 0.01 30` | `bg-[var(--muted)]` |
| `--muted-foreground` | `0.55 0.01 30` | `0.65 0.01 30` | `text-[var(--muted-foreground)]` |
| `--accent` | `0.93 0.03 12` (rose-tinted) | `0.32 0.04 12` | `bg-[var(--accent)]` |
| `--border` | `0.92 0.01 30` (warm light border) | `0.28 0.012 30` | `border-[var(--border)]` |
| `--input` | `0.92 0.01 30` | `0.28 0.012 30` | `border-[var(--input)]` |
| `--ring` | `0.65 0.18 12` (**rose focus ring**) | `0.72 0.16 12` | `ring-[var(--ring)]` |
| `--destructive` | `0.577 0.245 27.325` | `0.396 0.141 25.723` | `bg-[var(--destructive)]` |
| `--radius` | `0.75rem` | same | `rounded-[var(--radius)]` |

### Shadow System (warm-tinted — use instead of Tailwind defaults)

| Class | Usage |
|-------|-------|
| `shadow-warm` | Cards, small elements |
| `shadow-warm-md` | Elevated panels, dropdowns |
| `shadow-warm-lg` | Floating bars (RoomControls), modals |

These map to `--shadow-color` CSS tokens defined in `globals.css`. They carry a warm rose-brown tint at low opacity instead of pure black.

### Semantic Status Colors (inline Tailwind — no CSS var needed)

These are one-off status indicators. Use Tailwind semantic colors directly:

| Status | Bg class | Text class | Use case |
|--------|----------|-----------|----------|
| Waiting | `bg-yellow-400/20` | `text-yellow-600 dark:text-yellow-400` | Waiting for joiner |
| Connecting | `bg-blue-500/20` | `text-blue-600 dark:text-blue-400` | Initial connect |
| Connected | `bg-green-500/20` | `text-green-600 dark:text-green-400` | Active call |
| Reconnecting | `bg-orange-500/20` | `text-orange-600 dark:text-orange-400` | Retry in progress |
| Failed / Lost | `bg-red-500/20` | `text-red-600 dark:text-red-400` | Unrecoverable |
| Timeout | `bg-red-500/20` | `text-red-600 dark:text-red-400` | Retry window expired |

### Typography Scale

| Usage | Tailwind Classes |
|-------|----------------|
| Page hero heading | `text-4xl font-bold tracking-tight` |
| Card title | `text-xl font-semibold` |
| Section heading | `text-lg font-medium` |
| Body text | `text-base` |
| Label / caption | `text-sm text-[var(--muted-foreground)]` |
| Mono (IDs, URLs) | `text-sm font-mono` |

### Spacing Rhythm

| Context | Value |
|---------|-------|
| Card internal padding | `p-6` |
| Card gap between sections | `space-y-4` |
| Page horizontal padding | `px-4 md:px-6` |
| Page top padding (below header) | `pt-6 md:pt-10` |
| Button gap in groups | `gap-2` |
| Icon button size | `size-11` (44px — minimum touch target) |

---

## Responsive Breakpoints

Mobile-first. All components start at mobile layout, expand at `md:` (768px) and `lg:` (1024px).

| Breakpoint | Prefix | Key changes |
|-----------|--------|-------------|
| Mobile | (none) | Single column, stacked cards, larger touch targets |
| Tablet | `md:` | Two-column home layout, wider containers |
| Desktop | `lg:` | Max-width containers centered |

---

## Animation Specifications

All animations use Framer Motion. GPU-only transforms (`transform`, `opacity`) — no layout-triggering properties.

### Shared Framer Motion Variants

```typescript
// Page entrance (used in AnimatePresence)
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

// Card stagger (parent)
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

// Staggered card child
export const cardEntrance = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// QR code spring scale
export const qrReveal = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// Video fade in
export const videoFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

// Controls slide up from bottom
export const controlsSlideUp = {
  initial: { opacity: 0, y: 80 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit:    { opacity: 0, y: 80, transition: { duration: 0.2 } },
}

// Status badge entrance
export const badgePop = {
  initial: { opacity: 0, scale: 0.9, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
  exit:    { opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.15 } },
}
```

### CSS-only Pulse Animation (for status badges)

Add to `globals.css`:

```css
@keyframes pulse-ring {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.animate-pulse-slow {
  animation: pulse-ring 2s ease-in-out infinite;
}
```

---

## Component Specifications

---

### 1. `Header`

**File**: `src/components/layout/header.tsx`

**Purpose**: Global navigation + branding. Sticky at top. Semi-transparent with blur so video content shows through on the room page.

**Layout**:
```
[ gf-vid-chat (logo) ]    [ Home  Settings ]  [ 🌙 ]
```

**Specs**:
- Position: `sticky top-0 z-50`
- Background: `bg-[var(--background)]/80 backdrop-blur-md`
- Border bottom: `border-b border-[var(--border)]`
- Height: `h-14`
- Inner: `flex items-center justify-between px-4 md:px-6 max-w-screen-lg mx-auto w-full`

**Logo**:
- Text: `"gf-vid-chat"`, `font-semibold text-base tracking-tight text-[var(--foreground)]`
- Links to `/`

**Nav links**:
- `Home` → `/`, `Settings` → `/settings`
- Style: `text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150`
- Active state: `text-[var(--foreground)] font-medium`
- Gap: `gap-4`

**Theme toggle button**:
- Icon: `Sun` (light mode) or `Moon` (dark mode) from Lucide, `size-4`
- Button: `variant="ghost" size="icon"` (40×40px), `rounded-full`
- `aria-label="Toggle theme"`
- Tooltip on hover: "Switch to dark/light mode"

**Accessibility**:
- `<header role="banner">`
- `<nav aria-label="Main navigation">`
- Current page link: `aria-current="page"`

---

### 2. `PageContainer`

**File**: `src/components/layout/page-container.tsx`

**Purpose**: Consistent centered content wrapper for non-full-screen pages.

**Specs**:
```tsx
<div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full">
  {children}
</div>
```

- Max width: `max-w-2xl` (672px)
- Horizontal padding: `px-4` → `md:px-6`
- Vertical padding: `py-6` → `md:py-10`

---

### 3. `QrDisplay`

**File**: `src/components/qr/qr-display.tsx`

**Purpose**: Renders a QR code encoding the room join URL. Shown on the room page while waiting for the joiner.

**Props**:
```typescript
interface QrDisplayProps {
  url: string          // the full join URL
  size?: number        // QR pixel size, default 220
}
```

**Layout**:
```
┌─────────────────────────────────┐
│    [  QR CODE IMAGE  ]          │
│    Scan to join                  │
│    or share this link:           │
│    [  truncated URL  ]  [Copy]  │
└─────────────────────────────────┘
```

**Specs**:
- Container: `flex flex-col items-center gap-3 p-6`
- White QR background always (for scan contrast): `bg-white p-3 rounded-xl shadow-sm`
- QR size: `220px` default (responsive: `180px` on `< 360px` screens)
- Label: `"Scan to join"`, `text-sm font-medium text-[var(--muted-foreground)]`
- URL display: `text-xs font-mono text-[var(--muted-foreground)] break-all` — truncated to 40 chars with `…`
- Copy button: `variant="ghost" size="sm"` with `Copy` icon (`size-3`) and text "Copy link"

**Animation**: `qrReveal` (spring scale from 0.85)

**Accessibility**:
- `<figure aria-label="QR code to join room">`
- `<figcaption>Scan to join or share the link below</figcaption>`
- Copy button: `aria-label="Copy join link"`

---

### 4. `QrScanner`

**File**: `src/components/qr/qr-scanner.tsx`

**Purpose**: Activates device camera to scan a QR code. Used in the "Scan QR" tab of JoinRoom.

**Props**:
```typescript
interface QrScannerProps {
  onResult: (url: string) => void
  onError?: (error: string) => void
}
```

**Layout**:
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    [live camera feed]     │  │
│  │                           │  │
│  │  ┌─────┐       ┌─────┐   │  │
│  │  └─────┘       └─────┘   │  │
│  └───────────────────────────┘  │
│    Point camera at QR code       │
└─────────────────────────────────┘
```

**Specs**:
- Camera viewfinder: aspect ratio `aspect-square`, max `w-64`, `rounded-xl overflow-hidden`
- Corner frame overlay: 4 corner brackets rendered as `absolute` positioned `div`s with `border-2 border-[var(--primary)]`, `size-6`, no center fill
- Instruction text: `"Point camera at QR code"`, `text-sm text-[var(--muted-foreground)] text-center mt-2`
- Loading state: spinner centered in viewfinder while camera initializes
- Error state: red text `"Camera access denied"` with retry button

**Accessibility**:
- Container: `role="region" aria-label="QR code camera scanner"`
- Camera video element: `aria-label="Camera viewfinder"` (no visual label needed)
- Announce success via `aria-live="polite"` region

---

### 5. `QrUpload`

**File**: `src/components/qr/qr-upload.tsx`

**Purpose**: Drag-and-drop / click-to-select an image file containing a QR code. Decodes it using jsQR on a canvas. Used in the "Upload QR" tab of JoinRoom.

**Props**:
```typescript
interface QrUploadProps {
  onResult: (url: string) => void
}
```

**States**: `idle` | `dragging` | `processing` | `success` | `error`

**Layout (idle)**:
```
┌─────────────────────────────────┐
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│        [Upload icon]             │
│    Drop screenshot here         │
│    or click to select a file    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└─────────────────────────────────┘
```

**Specs**:
- Drop zone: `border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer`
- Hover/dragging: `border-[var(--primary)] bg-[var(--accent)]`
- Transition: `transition-colors duration-150`
- Icon: `Upload` from Lucide, `size-8 text-[var(--muted-foreground)] mx-auto mb-3`
- Primary text: `text-sm font-medium`
- Sub text: `text-xs text-[var(--muted-foreground)]`
- Accepted: `accept="image/*"`
- Processing state: spinner + `"Decoding QR code…"` text
- Success state: green checkmark + decoded URL preview (first 40 chars)
- Error state: `AlertCircle` icon + `"No QR code found"` text, retry link

**Accessibility**:
- Wrap in `<label>` with hidden `<input type="file">` — fully keyboard accessible
- `role="region" aria-label="Upload QR code image"`
- `aria-live="polite"` for status announcements

---

### 6. `CreateRoom`

**File**: `src/components/room/create-room.tsx`

**Purpose**: Card that lets the creator configure timeout and generate a new room.

**Props**: None (self-contained, navigates on submit)

**Layout**:
```
┌─────────────────────────────────┐
│  Start a Room                    │
│  ─────────────────────────────  │
│  Auto-reconnect timeout          │
│  [────────●──────────────] 1 hr  │
│  5 min            2 hr           │
│                                  │
│  Reconnects automatically for    │
│  up to 1 hour if connection      │
│  drops.                          │
│                                  │
│  [  Create Room  →  ]            │
└─────────────────────────────────┘
```

**Specs**:
- Card: `Card` component, `p-6`
- Title: `CardTitle` — `"Start a Room"` with `Video` icon (`size-5`) inline
- Subtitle: `CardDescription` — `"Share the QR code with your partner to connect"`
- Slider: native `<input type="range">` or ShadcnUI Slider. Min: `300000` (5min), Max: `7200000` (2hr), Step: `300000` (5min increments), Default: `3600000` (1hr)
  - Display value: formatted as `"X hr"` or `"X min"` (helper fn)
  - Visual: full width, `mt-2 mb-1`
- Range labels: `flex justify-between text-xs text-[var(--muted-foreground)]` — `"5 min"` | `"2 hr"`
- Description text: `text-sm text-[var(--muted-foreground)]` with dynamic timeout value
- CTA button: `variant="default" size="lg" w-full` — `"Create Room"` with `ArrowRight` icon

**Interaction**:
- Click "Create Room": generate `nanoid(10)` room ID → navigate to `/room/{id}?role=creator&timeout={ms}`

**Accessibility**:
- `aria-label` on slider: `"Auto-reconnect timeout"`
- `aria-valuetext` on slider: e.g. `"1 hour"`
- Button is focusable with Enter/Space activation

---

### 7. `JoinRoom`

**File**: `src/components/room/join-room.tsx`

**Purpose**: Card with three ways to join a room: camera scan, image upload, or pasting a link/room ID.

**Props**: None (navigates on success)

**Layout**:
```
┌─────────────────────────────────┐
│  Join a Room                     │
│  ─────────────────────────────  │
│  [Scan QR] [Upload QR] [Paste]  │
│  ─────────────────────────────  │
│  [tab content area]             │
└─────────────────────────────────┘
```

**Tab specs**:
- Container: `w-full`
- Tab bar: 3 equal-width buttons using `grid grid-cols-3`
- Active tab style: `bg-[var(--background)] text-[var(--foreground)] shadow-sm font-medium`
- Inactive tab style: `text-[var(--muted-foreground)] hover:text-[var(--foreground)]`
- Tab panel: `pt-4` below tab bar
- Tab 1 — **Scan QR**: renders `<QrScanner onResult={handleJoin} />`
- Tab 2 — **Upload QR**: renders `<QrUpload onResult={handleJoin} />`
- Tab 3 — **Paste Link**: text input for full URL or just room ID
  - Input placeholder: `"Paste room link or ID…"`
  - Style: `border border-[var(--input)] bg-[var(--background)] rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-[var(--ring)]`
  - Button: `"Join Room"` below input, `variant="default" w-full`

**Interaction**: `handleJoin(url)` extracts room ID + role param → navigates to `/room/{id}?role=joiner`

**Accessibility**:
- `role="tablist"` on tab bar
- Each tab: `role="tab" aria-selected aria-controls`
- Tab panel: `role="tabpanel" aria-labelledby`
- Full keyboard navigation: Arrow keys switch tabs, Tab moves into panel

---

### 8. `RoomControls`

**File**: `src/components/room/room-controls.tsx`

**Purpose**: Floating bottom action bar during active video call. Contains all call controls.

**Props**:
```typescript
interface RoomControlsProps {
  isMicOn: boolean
  isCameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onHangUp: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}
```

**Layout** (positioned absolutely/fixed in VideoGrid):
```
         ┌──────────────────────────────────────┐
         │  [🎤]  [📷]  [⛶]        [📞 hang up] │
         └──────────────────────────────────────┘
```

**Specs**:
- Position: `fixed bottom-6 left-1/2 -translate-x-1/2 z-30`
- Container: `flex items-center gap-3 px-5 py-3 rounded-full`
- Background: `bg-[var(--background)]/90 backdrop-blur-md border border-[var(--border)] shadow-warm-lg`
- All control buttons: `size-11 rounded-full` (44px touch target)
- Mic button:
  - On: `variant="ghost"` — `Mic` icon
  - Off: `bg-red-500/10 text-red-500 hover:bg-red-500/20` — `MicOff` icon
  - `aria-label="Mute microphone"` / `"Unmute microphone"`
- Camera button:
  - On: `variant="ghost"` — `Video` icon
  - Off: `bg-red-500/10 text-red-500` — `VideoOff` icon
  - `aria-label="Turn off camera"` / `"Turn on camera"`
- Fullscreen: `variant="ghost"` — `Maximize` / `Minimize` icon
  - `aria-label="Enter fullscreen"` / `"Exit fullscreen"`
- Hang up (rightmost, visually separated by `ml-2`):
  - `bg-red-500 hover:bg-red-600 text-white rounded-full size-11`
  - Icon: `PhoneOff` (`size-5`)
  - `aria-label="End call"`
- Divider: `w-px h-6 bg-[var(--border)] mx-1` between general controls and hang up

**Animation**: `controlsSlideUp` on mount. Auto-hide after 4s of inactivity (fade to `opacity-30`), reappear on any pointer movement.

**Accessibility**:
- `role="toolbar" aria-label="Call controls"`
- All buttons have visible focus rings

---

### 9. `VideoPlayer`

**File**: `src/components/video/video-player.tsx`

**Purpose**: `<video>` element wrapper with consistent sizing, mirroring for local feed, and fade-in when stream arrives.

**Props**:
```typescript
interface VideoPlayerProps {
  stream: MediaStream | null
  muted?: boolean
  mirror?: boolean      // true for local video (selfie view)
  className?: string
  label?: string        // accessible label, e.g. "Your video"
  objectFit?: 'cover' | 'contain'  // default 'cover'
}
```

**Specs**:
- Element: `<video autoPlay playsInline>`
- `muted` when `muted={true}` (always for local, never for remote)
- Mirror: `style={{ transform: 'scaleX(-1)' }}` when `mirror={true}`
- Object fit: `object-cover` (default) fills container; `object-contain` letterboxes
- Rounded: `rounded-2xl overflow-hidden` on container `<div>`
- Background when no stream: `bg-[var(--muted)]` with centered `VideoOff` icon (`size-8 text-[var(--muted-foreground)]`)
- Stream attach effect: `useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream }, [stream])`

**Animation**: When `stream` changes from `null` → `MediaStream`, wrap in `<AnimatePresence>` and apply `videoFadeIn` variant.

**Accessibility**:
- `aria-label={label}` on the container
- `<video>` has no visible controls (call controls handle this)

---

### 10. `VideoGrid`

**File**: `src/components/video/video-grid.tsx`

**Purpose**: Full-screen layout during active call. Remote video fills the entire viewport. Local video is a small PiP overlay. When no remote stream (waiting state), shows the QrDisplay centered instead.

**Props**:
```typescript
interface VideoGridProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  roomUrl: string        // for QR display while waiting
  connectionState: ConnectionState
}
```

**Layout — Connected state**:
```
┌──────────────────────────────────────────┐
│                                           │
│      [REMOTE VIDEO — full screen]        │
│                                           │
│                         ┌───────────┐    │
│                         │ local PiP │    │
│                         └───────────┘    │
└──────────────────────────────────────────┘
```

**Layout — Waiting state**:
```
┌──────────────────────────────────────────┐
│  bg-[var(--background)]                  │
│                                           │
│          [QrDisplay centered]             │
│                                           │
│         Waiting for your partner…        │
└──────────────────────────────────────────┘
```

**Specs**:

Remote video:
- `position: fixed; inset: 0` — truly full-screen behind everything
- `VideoPlayer stream={remoteStream} objectFit="cover"`
- Dark scrim overlay: `absolute inset-0 bg-black/10` (subtle, improves badge readability)

Local PiP:
- `absolute bottom-24 right-4` (above the controls bar)
- Size: `w-28 h-40 md:w-36 md:h-52`
- `rounded-xl overflow-hidden shadow-lg border-2 border-white/20`
- `VideoPlayer stream={localStream} muted mirror`
- Draggable (optional, stretch goal): wrap in Framer Motion `drag` with `dragConstraints` to viewport

Waiting state:
- Full-screen centered flex: `flex flex-col items-center justify-center min-h-screen gap-6`
- Background: `bg-[var(--background)]`
- `QrDisplay url={roomUrl}`
- Text: `"Waiting for your partner…"` — `text-sm text-[var(--muted-foreground)] animate-pulse-slow`

**Accessibility**:
- `role="main" aria-label="Video call"`
- Announce state changes via `aria-live="polite"` region (hidden visually, screen reader only)

---

### 11. `ConnectionStatus`

**File**: `src/components/video/connection-status.tsx`

**Purpose**: Floating status badge showing the current connection state. Positioned top-center, overlaid on the video grid.

**Props**:
```typescript
interface ConnectionStatusProps {
  state: ConnectionState
  retryCount?: number
  timeRemainingMs?: number
}
```

**Position**: `absolute top-4 left-1/2 -translate-x-1/2 z-20`

**States & Visual Specs**:

| State | Icon | Text | Color classes | Behavior |
|-------|------|------|--------------|----------|
| `initializing` | `Loader2` (spin) | `"Initializing…"` | blue | Steady |
| `waiting` | `Clock` | `"Waiting for partner…"` | yellow | Pulse |
| `connecting` | `Loader2` (spin) | `"Connecting…"` | blue | Spin |
| `connected` | `CheckCircle2` | `"Connected"` | green | Auto-hide after 3s |
| `reconnecting` | `RefreshCw` (spin) | `"Reconnecting… (attempt N)"` | orange | Pulse + count |
| `failed` | `XCircle` | `"Connection lost"` | red | Steady |
| `timeout` | `Clock` | `"Session ended"` | red | Steady |

**Badge structure**:
```tsx
<motion.div
  variants={badgePop}
  initial="initial"
  animate="animate"
  exit="exit"
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
             bg-[color]/20 text-[color] backdrop-blur-sm border border-[color]/30"
>
  <Icon className="size-3" />
  {text}
</motion.div>
```

**Auto-hide logic**: When state transitions to `connected`, set a 3s timer then set `hidden=true`. Any subsequent state change resets `hidden=false`.

**Reconnecting extra info**: When `timeRemainingMs > 0`, show below badge: `"Session ends in X:XX"` — `text-xs text-[var(--muted-foreground)]`.

**Accessibility**:
- `role="status" aria-live="polite" aria-atomic="true"`
- `aria-label` reflects full state text

---

### 12. `HomePage`

**File**: `src/pages/home-page.tsx`

**Layout**:
```
          ┌────────────────────────────────────────────┐
          │  gf-vid-chat                                │
          │  P2P video for couples — silent, always-on  │
          │                                             │
          │  ┌─────────────────┐  ┌─────────────────┐  │
          │  │   Start a Room  │  │   Join a Room    │  │
          │  │                 │  │                  │  │
          │  │  [slider]       │  │  [tabs]          │  │
          │  │  [Create Room]  │  │                  │  │
          │  └─────────────────┘  └─────────────────┘  │
          └────────────────────────────────────────────┘
```

**Mobile** (< `md`): Cards stacked vertically, full width
**Desktop** (`md:`): Cards side-by-side `grid grid-cols-2 gap-6`

**Specs**:
- Wrapped in `PageContainer`
- Hero section: `text-center mb-8 md:mb-10`
  - H1: `"gf-vid-chat"`, `text-4xl font-bold tracking-tight`
  - Tagline: `"P2P video for couples — silent, always-on reconnect"`, `text-lg text-[var(--muted-foreground)] mt-2`
  - Optional hero image: `src/assets/hero.png` if present, `w-full max-w-sm mx-auto mt-4 rounded-2xl`
- Cards grid: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Each card fills its column: `h-full`

**Animation**:
- Page: `pageVariants` (fade + slide up)
- Cards: `staggerContainer` parent + `cardEntrance` on each card (stagger 80ms)

**Accessibility**:
- `<main>` wrapping content
- `<h1>` is the first heading (only one per page)
- Cards are visually distinct (border, shadow), not just color differences

---

### 13. `RoomPage`

**File**: `src/pages/room-page.tsx`

**Purpose**: Full-screen video call page. Assembles all video/QR/control components. Wires `usePeer` + `useMediaStream` + `useConnectionTimer`.

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│  [ConnectionStatus — floating top-center]             │
│                                                        │
│  [VideoGrid — fills entire viewport]                  │
│         ↳ includes PiP local video                    │
│         ↳ shows QrDisplay when waiting                │
│                                                        │
│  [RoomControls — floating bottom-center]              │
└──────────────────────────────────────────────────────┘
```

**Specs**:
- Page root: `relative w-full h-screen overflow-hidden bg-black`
- No Header visible on this page (full-screen immersive)
- Route params: `roomId` from URL path, `role` and `timeout` from query string
- Error states (full-screen centered):
  - Camera denied: `CameraOff` icon + `"Camera access required"` + retry button
  - Session timeout: `"Session ended"` + `"Create a new room"` button → navigate to `/`
  - Failed: `"Connection failed"` + `"Go home"` button

**On mount**:
1. Call `useMediaStream()` → get local stream
2. Call `usePeer({ roomId, role, localStream, retryTimeoutMs })`
3. Pass streams + state to `VideoGrid` and `RoomControls`
4. Show `ConnectionStatus` with current `connectionState`

**Accessibility**:
- `<main role="main" aria-label="Video call room">`
- Hidden `<h1>` for screen readers: `sr-only` — `"Active video call with {roomId}"`

---

### 14. `SettingsPage`

**File**: `src/pages/settings-page.tsx`

**Layout**:
```
┌─────────────────────────────────┐
│  Settings                        │
│  ─────────────────────────────  │
│  Appearance                      │
│  ┌────────┬────────┬──────────┐  │
│  │ Light  │  Dark  │  System  │  │
│  └────────┴────────┴──────────┘  │
│                                  │
│  About                           │
│  gf-vid-chat v1.0                │
│  P2P video · No servers          │
└─────────────────────────────────┘
```

**Specs**:
- Wrapped in `PageContainer`
- H1: `"Settings"`, `text-2xl font-bold mb-6`

**Appearance section**:
- Section heading: `text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3`
- Theme selector: 3-button segmented control
  - Container: `inline-flex rounded-lg border border-[var(--border)] p-1 gap-1 bg-[var(--muted)]`
  - Each option: `rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150`
  - Active: `bg-[var(--background)] text-[var(--foreground)] shadow-sm`
  - Inactive: `text-[var(--muted-foreground)] hover:text-[var(--foreground)]`
  - Options: `Light` (Sun icon), `Dark` (Moon icon), `System` (Monitor icon)

**About section**:
- `mt-8 pt-6 border-t border-[var(--border)]`
- App name: `text-sm font-medium`
- Version: `text-xs text-[var(--muted-foreground)]`
- Description: `text-xs text-[var(--muted-foreground)] mt-1`
- Link: `"View source on GitHub"` → Lucide `ExternalLink` icon inline

**Animation**: `pageVariants` on mount

**Accessibility**:
- `<main>`
- Theme buttons: `role="radiogroup" aria-label="Theme"`, each button: `role="radio" aria-checked`
- Keyboard: Arrow keys switch theme options

---

## Accessibility Checklist

### Color Contrast
- All text on `--background`: WCAG AA minimum 4.5:1
- Status badge text on colored backgrounds: verified by using `oklch` with sufficient lightness difference
- `--muted-foreground` on `--background`: passes at `text-sm` and above (3:1 for large text)

### Focus Management
- All interactive elements have visible focus rings: `focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2`
- On modal/dialog open: focus moves to first focusable element
- On room join (navigation): focus moves to page `<h1>`
- Focus never gets trapped outside intended zones

### Touch Targets
- Minimum 44×44px on all interactive elements (enforced by `size-11` = 44px on controls)
- On mobile, extra padding added to small inline links

### Screen Reader Support
- All icons-only buttons have `aria-label`
- Dynamic content updates use `aria-live="polite"` (or `"assertive"` for errors)
- Connection state changes announced without disturbing call
- QR codes have text alternatives with the join URL

### Keyboard Navigation
- Full keyboard operability (Tab, Shift+Tab, Enter, Space, Arrow keys where appropriate)
- No keyboard traps
- Skip-to-main-content link (optional enhancement): `<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2">Skip to main content</a>`

### Reduced Motion
Add to `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
And in Framer Motion variants, check `useReducedMotion()` hook and replace with instant transitions.

---

## Component File Map

```
src/components/
├── layout/
│   ├── header.tsx              Header
│   └── page-container.tsx      PageContainer
├── video/
│   ├── video-player.tsx        VideoPlayer
│   ├── video-grid.tsx          VideoGrid
│   └── connection-status.tsx   ConnectionStatus
├── qr/
│   ├── qr-display.tsx          QrDisplay
│   ├── qr-scanner.tsx          QrScanner
│   └── qr-upload.tsx           QrUpload
└── room/
    ├── create-room.tsx         CreateRoom
    ├── join-room.tsx           JoinRoom
    └── room-controls.tsx       RoomControls

src/pages/
├── home-page.tsx               HomePage
├── room-page.tsx               RoomPage
└── settings-page.tsx           SettingsPage
```

---

## ShadcnUI Component Usage Guide

Use existing primitives from `src/components/ui/`:

| Component | Used in |
|-----------|---------|
| `Button` | All CTAs, control buttons, theme toggle |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | CreateRoom, JoinRoom |
| `Switch` | (not primary — prefer themed buttons for settings) |

For Slider (needed in CreateRoom), add a minimal ShadcnUI-style slider:
```typescript
// src/components/ui/slider.tsx
// Wraps <input type="range"> with consistent styling
```

For Badge (ConnectionStatus), add:
```typescript
// src/components/ui/badge.tsx
// Simple pill with variant props
```

For Tabs (JoinRoom), add:
```typescript
// src/components/ui/tabs.tsx
// Radix UI Tabs primitive or custom implementation
```

---

## Error State Design

### Camera Access Denied
- Full-screen centered card
- `CameraOff` icon (`size-16 text-[var(--muted-foreground)]`) 
- Title: `"Camera access required"`
- Body: `"Please allow camera and microphone access in your browser settings."`
- Button: `"Try again"` (retries `getUserMedia`)

### Session Timeout
- Full-screen centered card
- `Clock` icon
- Title: `"Session ended"`
- Body: `"The auto-reconnect window has expired."`
- Button: `"Start new room"` → navigate to `/`

### Connection Failed (unrecoverable)
- Overlay on video grid (doesn't kick user out immediately)
- Same `ConnectionStatus` badge with red "Connection lost" state
- After 5s, show full-screen error with option to retry manually

### No QR Code Found (upload)
- Inline error in QrUpload drop zone
- `AlertCircle` icon + `"No QR code detected in this image"`
- `"Try a different image"` link resets the component

---

## Implementation Notes for Frontend Dev

1. **CSS variables in Tailwind v4**: Use `bg-[var(--card)]` syntax — Tailwind v4 doesn't auto-map CSS variables to utility classes unless explicitly configured.

2. **Dark mode**: Applied via `.dark` class on `<html>` (managed by `ThemeProvider`). The `@custom-variant dark` in `globals.css` handles this.

3. **Video element quirks**:
   - Always set `playsInline` on `<video>` for iOS Safari
   - Always set `muted` on local video to prevent audio feedback
   - Use `useRef` + `useEffect` to set `srcObject` — don't use `src` attribute

4. **PeerJS peer ID format**: `gfvc-{roomId}` (defined in `peer-config.ts` as `PEER_ID_PREFIX`)

5. **Room URL format**: `https://{domain}/room/{roomId}?role=joiner` — the QrDisplay encodes this full URL

6. **Framer Motion with AnimatePresence**: Wrap route outlet in `<AnimatePresence mode="wait">` in `App.tsx` for page transitions. Each page component must be a `motion.div` at root.

7. **Touch event handling**: For drag on PiP video and any swipe gestures, use Framer Motion's `drag` prop — don't roll custom touch handlers.

---

## Soft + Warm Direction — Quick Reference

A cheat sheet for consistent warm-direction implementation across all components.

### Do Use

| Pattern | Class / Token |
|---------|--------------|
| Card shadows | `shadow-warm` or `shadow-warm-md` |
| Floating bar shadows | `shadow-warm-lg` |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-[var(--ring)]` (rose) |
| Primary buttons | `bg-[var(--primary)] text-[var(--primary-foreground)]` (rose bg, warm white text) |
| Active/hover states | `hover:bg-[var(--accent)]` (rose-tinted accent) |
| Page background glow | `bg-warm-gradient` on HomePage and SettingsPage wrappers |
| Border radius | `rounded-[var(--radius)]` (0.75rem) or `rounded-full` for circular controls |
| Input focus | `focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]` |

### Don't Use

| Anti-pattern | Why |
|-------------|-----|
| `shadow`, `shadow-md`, `shadow-lg` (Tailwind defaults) | Pure black — looks cold next to warm palette |
| Hardcoded `#` hex colors | Breaks dark mode and theme consistency |
| `rounded-md` on cards | Too tight — use `rounded-[var(--radius)]` (0.75rem) |
| `bg-gray-*` or `text-gray-*` | Neutral grey clashes with warm tone — use `--muted` / `--muted-foreground` |
| `ring-blue-500` for focus | Overrides the rose ring — always use `ring-[var(--ring)]` |

### Warm Direction by Component

| Component | Warm-specific detail |
|-----------|---------------------|
| `Header` | `shadow-warm` on sticky bottom edge; logo could use `text-[var(--primary)]` for a pop of rose |
| `CreateRoom` / `JoinRoom` cards | `shadow-warm-md`, `rounded-[var(--radius)]` |
| `Button` (default/primary) | Rose bg (`--primary`), warm white text (`--primary-foreground`), rose focus ring |
| `QrDisplay` | QR white background stays white (contrast), but card wrapper uses warm shadow |
| `QrUpload` drop zone | Drag-over state: `border-[var(--primary)] bg-[var(--accent)]` — rose border + rosy tint |
| `RoomControls` bar | `shadow-warm-lg` on the floating pill |
| `ConnectionStatus` badge | Existing semantic colors (yellow/blue/green/orange/red) — unchanged, they work warm |
| `HomePage` | Apply `bg-warm-gradient` for the soft rose glow at top; NOT on RoomPage |
| `SettingsPage` | Apply `bg-warm-gradient`; theme selector active state uses `--primary` underline or ring |
| Error states | Use `--destructive` (already warm-adjacent red); icon in `text-[var(--primary)]` for soft feel |
