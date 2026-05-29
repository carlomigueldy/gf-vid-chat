# gf-vid-chat — Design Enhancement & Responsive Redesign

**Date:** 2026-05-30
**Status:** Approved (brainstorming) — ready for implementation planning
**Scope:** Visual/UX enhancement and responsive overhaul of the existing app. **No changes to P2P logic, auto-reconnect state machine, QR encode/decode, or routing.** This is a presentation-layer redesign.

---

## 1. Context & Goal

gf-vid-chat is a pure client-side P2P video chat app for couples — QR-based, no accounts, auto-reconnecting so a sleeping partner never has to re-dial. The current UI works and ships a "Soft + Warm" rose/cream design system (`src/globals.css`, `docs/UI_SPECS.md`), but the layouts read as generic (centered hero + two flat cards, a sparse Settings page).

**Goal:** elevate the existing Soft + Warm identity into a distinctive, polished, characterful interface and make every surface genuinely responsive — **phone-first**, scaling up to tablet and desktop with restraint.

This spec elevates `docs/UI_SPECS.md`; that file's color tokens remain the source of truth. Where they conflict, this document wins for *expression* (type, shape, layout, motion); `UI_SPECS.md` wins for the *color token values*.

---

## 2. Decisions Summary

| Dimension | Decision |
|---|---|
| Visual identity | **Elevate** Soft + Warm (rose/cream) — keep palette, raise expression |
| Personality | Playful & Characterful, executed as **"Soft & Rounded"** |
| Display type | **Fredoka** (500–600), self-hosted |
| Body / UI type | **Plus Jakarta Sans** (400/600/800), self-hosted |
| Design language | Pill buttons, soft rose-tinted **glow** shadows, large radius, **no hard borders** |
| Home layout | **Segmented hero** — one pill toggle swaps Start ⇄ Join in place |
| Active call | Floating glass control dock, draggable rounded PiP, **calm breathing reconnect** |
| Settings | Structured single column: Appearance / Defaults / About cards |
| Device priority | **Phone-first**; scale up to a centered, capped column |
| Motion | Playful-but-calm springs, fully `prefers-reduced-motion` gated |

---

## 3. Design Foundation

### 3.1 Typography
- **Display / headings:** Fredoka — rounded, warm, friendly (weights 500–600).
- **Body / UI:** Plus Jakarta Sans (400/600/800).
- **Loading:** self-host both as `woff2` (e.g. via `@fontsource/fredoka` and `@fontsource-variable/plus-jakarta-sans`, or local files in `public/fonts`). **No runtime Google CDN call** — preserves offline use and privacy. `font-display: swap`, with `system-ui, -apple-system, sans-serif` fallback.
- **Roles:** hero/page titles, card titles, segmented labels, and primary button text use Fredoka. Everything else (paragraphs, captions, inputs, mono IDs) uses Plus Jakarta Sans. Monospace (room IDs/URLs) stays a system mono stack.
- Hero headings use fluid sizing via `clamp()` (see §5).

### 3.2 Color Tokens
Keep all existing `:root` / `.dark` tokens in `src/globals.css` unchanged (rose primary `oklch(0.65 0.18 12)`, warm cream background, warm-charcoal dark). **Additions:**
- `--primary-gradient`: rose → deeper-rose linear gradient for the primary CTA, e.g. `linear-gradient(90deg, oklch(0.70 0.17 12), oklch(0.62 0.21 8))`. Dark mode uses the lighter rose pair.
- `--glow-primary`: a soft rose-tinted shadow color for the CTA glow (low-opacity rose, distinct from the neutral `--shadow-color`).
- Richer ambient bloom: extend `.bg-warm-gradient` into a stronger radial rose glow used behind heroes and waiting states.

### 3.3 Shape & Depth
- **Radius:** cards `~1.25rem` (rounded-3xl feel); buttons become **full pills** (`rounded-full`); inputs/segmented controls `~0.875rem`; PiP/QR tiles `~1rem`.
- **Shadows:** no hard borders, no pure black. Use the warm-tinted `.shadow-warm-*` utilities, plus a new **glow** variant for the primary CTA (layered soft rose shadow). Cards get a single soft rose-tinted drop shadow rather than a border.
- **Segmented control** is the recurring primitive: a pill track (`--muted`) with a white raised "thumb" carrying a soft rose shadow on the active segment. Used for Start⇄Join, Scan/Upload/Paste, and the theme toggle.

### 3.4 Iconography & Emoji
- Keep `lucide-react` for all functional icons.
- A small, curated set of emoji (💗 🌙 ✨ 📷 🔗) used **sparingly** as warmth/personality accents — never as the only signifier of a function (always paired with text or a lucide icon for accessibility).

### 3.5 Motion Personality
- Framer Motion, **GPU-only** transforms (`transform`/`opacity`).
- **Springs with gentle overshoot** for: button press (soft scale), segmented-toggle thumb slide, card/hero entrance, QR reveal.
- **Calm, not flashy** in the call: status and reconnect use slow "breathing" opacity pulses (~2s), never fast/alarming motion.
- **All motion gated** behind `@media (prefers-reduced-motion: reduce)` (already scaffolded in `globals.css`); reduced-motion collapses to near-instant cross-fades.

---

## 4. Surface Specifications

### 4.1 Global Chrome
- **Header:** slim. Logo = rose dot + Fredoka "gf-vid-chat" wordmark; Home / Settings nav; animated theme toggle (sun ↔ moon morph). On `lg+`, the header becomes a **centered floating pill**; on phone it's a simple top bar.
- **Page transitions:** keep the existing `AnimatePresence` fade + slide, retuned to a gentle spring.
- **Background:** ambient rose glow (`.bg-warm-gradient`, richer) on Home and Settings. **Not** on the room page (video fills the screen).

### 4.2 Home — Segmented Hero
- Single centered column. Hero: Fredoka headline (e.g. "Stay close, even asleep. 💗") + Plus Jakarta tagline.
- **Segmented pill toggle:** `Start a room` ⇄ `Join a room`. Exactly one panel visible at a time — no scrolling on phone, no split attention. The thumb slides on toggle.
- **Start panel:** soft card with the auto-reconnect **timeout slider** (rose fill + ring-haloed knob), plain-language helper ("Reconnects for up to **1 hr**"), and the primary pill CTA **"Create Room ✨"** with rose-glow shadow.
- **Join panel:** nested **Scan / Upload / Paste** segmented control + the active method's content (see §4.3).
- Preserves existing create/join wiring and the timeout query param.

### 4.3 Join + QR Flows
- **QR display (creator side):** QR in a rounded card on a soft rose-glow backdrop; rounded QR modules with a tiny 💗 center mark; a copyable room-link chip; a calm **"Waiting for your partner…"** breathing state.
- **Scan:** camera feed in a rounded viewfinder with animated rose corner guides.
- **Upload:** dashed rounded drop-zone (tap or drag); decode via existing `jsQR` canvas path.
- **Paste:** clean pill input with inline validation (valid link → enabled "Join →" pill).
- On `lg+`, the QR and its link chip sit side by side; on phone they stack.

### 4.4 Active Call (Hero)
- Full-bleed remote video. Chrome recedes.
- **Floating glass control dock:** bottom-center pill, `backdrop-blur`, containing mic toggle / camera toggle / **hang-up** (rose-destructive gradient) / fullscreen. **Auto-hides after ~4s** of inactivity; reappears on tap/mouse-move.
- **Local PiP:** rounded tile, **draggable** with a grip handle, snaps to corners; **tap to swap** local ⇄ remote.
- **Status pill:** minimal, top-center; shows state + call timer; **auto-hides when the connection is stable**.
- **Calm reconnect state:** soft **breathing rose glow** overlay + "Hang tight…" + plain-language retry countdown and time-remaining ("next attempt in 4s · up to 58 min left"). Deliberately **never** a jarring full-screen red error — the user may be asleep.
- **Timeout-reached / failed:** a gentle centered card with one-tap **"Reconnect"** and **"Leave"** — calm, not alarming.
- Maps to the existing `ConnectionState` machine; this is purely how each state is presented.

### 4.5 Settings
- Centered single column (max-w ~640px) at all sizes. Grouped cards:
  - **Appearance** — theme as a segmented control (Light / Dark / System) with mini visual previews.
  - **Defaults** — default reconnect timeout; "mirror my video" toggle.
  - **About** — name, version, "P2P · no accounts · no servers", GitHub link.
- Fills the previously-empty space gracefully instead of floating top-left.

---

## 5. Responsive Strategy

**Principle:** phone-first; the intimate two-person UI stays in a **comfortable centered column**. Large screens get whitespace + ambient glow and a floating header — content is **never** stretched edge-to-edge.

| Tier | Width | Behavior |
|---|---|---|
| Base (phone) | `< 768px` | Single column; full-width segmented hero; full-width control dock; small bottom-right PiP |
| `md:` (tablet) | `768–1023px` | Centered ~560px column; larger type; more vertical rhythm; glow more present |
| `lg:`+ (desktop) | `≥ 1024px` | Capped column (~620px) with generous side whitespace; floating pill header; larger PiP; centered dock; optional rounded "theater" frame + glow around call video |

**Per-surface adaptation**
- **Active call:** video fills the viewport at every size; landscape phone handled (dock hugs bottom, status top); desktop may cap video in a rounded theater frame.
- **QR display:** card grows from full-width (phone) to a fixed comfortable size (desktop) with the link chip beside it on wide screens.
- **Settings:** single centered column everywhere; cards full-width on phone, within the column on desktop.

**Mechanics**
- Tailwind mobile-first classes; breakpoints `md`=768, `lg`=1024, `xl`=1280.
- **Fluid type** via `clamp()` for hero headings (smooth, not just stepped).
- **44px** minimum touch targets (existing `size-11` icon-button rule).
- **`100dvh`** (not `100vh`) for the call so mobile browser chrome never clips controls.
- **Safe-area insets** (`env(safe-area-inset-*)`) for notch / home-bar — applied to header and the control dock.
- Container-query-friendly panels where a card should adapt to its own width rather than the viewport.

---

## 6. Accessibility
- Color is never the sole status signal — pair with text/icon (the call status pill always shows a label).
- Maintain WCAG AA contrast for text on cream/charcoal and on the rose CTA (verify rose gradient + white text).
- All interactive controls keyboard-focusable with a visible rose focus ring (`--ring`); logical tab order.
- Emoji are decorative — hide from AT (`aria-hidden`) where a text label already conveys meaning; provide `aria-label`s on icon-only buttons in the dock.
- Respect `prefers-reduced-motion` (collapse springs/breathing to cross-fades).
- Draggable PiP has a non-drag fallback (tap-to-swap) for users who can't drag.

---

## 7. Affected Files (implementation touchpoints)
Presentation only — no logic rewrites.
- `src/globals.css` — add `--primary-gradient`, `--glow-primary`, richer glow; font-face/import; pill + glow utilities.
- `package.json` — add self-hosted font packages (`@fontsource*`).
- `src/lib/animations.ts` — spring variants (toggle, press, entrance, breathing).
- `src/components/layout/header.tsx`, `page-container.tsx` — floating header, safe-area, glow.
- `src/pages/home-page.tsx` + `src/components/room/create-room.tsx`, `join-room.tsx` — segmented hero.
- `src/components/qr/*` — viewfinder, drop-zone, paste input, QR card styling.
- `src/pages/room-page.tsx` + `src/components/video/*` (`video-grid`, `video-player`, `connection-status`) and `src/components/room/room-controls.tsx` — glass dock, draggable PiP, calm reconnect, `100dvh`.
- `src/pages/settings-page.tsx` — grouped cards, theme segmented control.
- `src/components/ui/*` — extend `button` (pill + gradient + glow variants), add a reusable `segmented-control`.
- `docs/UI_SPECS.md` — update to reflect elevated expression (type, shape, motion).
- Existing component tests updated to match new markup where needed.

---

## 8. Out of Scope (YAGNI)
- No changes to PeerJS config, signaling, ICE/STUN, or the reconnect algorithm.
- No new routes, accounts, persistence beyond existing theme/preference localStorage.
- No new dependencies beyond self-hosted fonts (reuse Framer Motion, lucide, Tailwind already present).
- No multi-party (>2) layouts.
- No full re-theme / new color palette (explicitly elevating, not replacing).

---

## 9. Acceptance Criteria
- [ ] Fredoka + Plus Jakarta render, self-hosted, no external CDN request at runtime; system fallback works.
- [ ] Home uses the segmented hero; Start ⇄ Join swaps in place with an animated thumb; no scroll needed on a typical phone.
- [ ] Buttons are pills with rose gradient + glow; cards use soft rose-tinted shadows, no hard borders.
- [ ] Active call: glass dock auto-hides/reveals; PiP draggable + tap-to-swap; status auto-hides when stable.
- [ ] Reconnecting state is calm (breathing glow + plain-language countdown), never a red full-screen error.
- [ ] Settings shows Appearance / Defaults / About cards in a centered column.
- [ ] Layouts verified at phone (≤480), tablet (768), and desktop (≥1280): centered capped column, no edge-to-edge stretch, no overflow.
- [ ] `100dvh` + safe-area insets verified on mobile; call controls never clipped.
- [ ] `prefers-reduced-motion` collapses animations; AA contrast holds; icon-only dock buttons have `aria-label`s.
- [ ] Light + dark modes both correct.
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` all pass; Vercel preview deploys.
