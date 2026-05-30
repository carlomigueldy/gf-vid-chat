# Responsive Call Layout (Desktop "Theater") — Design

**Date:** 2026-05-30
**Status:** Approved (self-approved per user delegation)
**Scope:** Stop the active-call remote video from looking stretched/over-cropped on desktop/laptop/ultrawide screens by presenting it in a centered, capped "theater" frame on large screens, while keeping the immersive full-bleed phone experience on mobile.

## Problem
In a connected call, `VideoGrid` renders the remote video full-bleed with `object-cover` (`absolute inset-0 w-full h-full`). On wide/ultrawide desktop viewports this crops a typical 4:3/16:9 webcam heavily to fill the screen — it reads as zoomed/"stretched." The original design spec anticipated a desktop "theater" frame but it was never implemented; the app is phone-first and shipped full-bleed everywhere.

## Solution
A responsive split, no JS branching — pure Tailwind breakpoints:

- **Mobile / tablet (`< lg`, <1024px):** unchanged. Full-bleed remote video, `object-cover`, immersive.
- **Desktop (`lg+`):** the remote video sits in a **centered, capped stage** — `max-w-[1180px]`, `aspect-video` (16:9), `max-h-[86vh]`, `rounded-3xl`, hairline border, soft glow — on a **dark theater backdrop**. The video uses **`object-contain`** so any camera aspect (4:3, 16:9, portrait phone) shows **whole** — never stretched, never aggressively cropped — with letterbox areas filled by the dark backdrop.

## Components & changes

1. **`VideoPlayer`** (`src/components/video/video-player.tsx`): add an optional `videoClassName?: string` applied to the `<video>` element (merged after the `objectFit` class). Lets a consumer set a responsive object-fit (`lg:object-contain`) without changing the shared default. Outer-div `className` passthrough unchanged.

2. **`globals.css`**: add a `.call-stage-bg` utility — `background-color: #000` on mobile; a dark warm **radial gradient** at `min-width: 1024px` (so the theater letterbox reads as an intentional dark stage with depth).

3. **`VideoGrid`** (`src/components/video/video-grid.tsx`) connected branch: wrap the main `VideoPlayer` in a backdrop layer (`.call-stage-bg`, centered flex, `lg:p-8`) containing a **stage** div — full-bleed `h-full w-full` on mobile, capped centered `lg:aspect-video lg:max-w-[1180px] lg:max-h-[86vh] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-glow` on desktop. The main `VideoPlayer` fills the stage (`absolute inset-0`), is `bg-transparent` (so the stage backdrop shows in the letterbox), `objectFit="cover"` + `videoClassName="lg:object-contain"`. The scrim and the draggable PiP/swap button are unchanged (they remain viewport-anchored, floating over the backdrop — acceptable on desktop).

4. **`room-page.tsx`**: the call's `<main>` background changes `bg-[var(--background)]` → `bg-black` so no cream edge shows behind the desktop theater (the call surface is intentionally dark; timeout/camera-error screens keep their own themed backgrounds).

## Non-goals
- No change to mobile/tablet layout, the reconnect overlay, controls dock, status pill, quality indicator, or PiP behavior (they float over the call at all sizes as today).
- No per-aspect dynamic sizing of the stage; a fixed 16:9 capped stage with `object-contain` is sufficient and robust.

## Testing
- `video-grid.test` (waiting + PiP swap) and `video-player.test` stay green; the swap button and labels are unchanged.
- Pure-CSS responsive change ⇒ verification is visual: capture a connected call at mobile (~390px), tablet (~834px), and desktop (~1440px) and confirm desktop shows the centered, contained theater (not stretched) while mobile stays full-bleed.
- `type-check` / `lint` / `test` / `build` / `e2e` green; deployed to Vercel and spot-checked live.

## Acceptance
- [ ] Desktop (`lg+`) shows the remote video centered in a capped, rounded theater on a dark backdrop, `object-contain` (whole frame, not stretched/over-cropped).
- [ ] Mobile/tablet unchanged (full-bleed `object-cover`).
- [ ] PiP swap still works; existing tests green; no new console errors.
- [ ] Built and deployed live.
