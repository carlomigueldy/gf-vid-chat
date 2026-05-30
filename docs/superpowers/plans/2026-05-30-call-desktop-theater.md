# Responsive Call Layout (Desktop Theater) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Present the active-call remote video in a centered, capped "theater" frame on desktop (`lg+`) with `object-contain` so it's never stretched/over-cropped, while keeping the immersive full-bleed `object-cover` on mobile.

**Architecture:** Pure Tailwind-breakpoint CSS — no JS branching. `VideoPlayer` gains an optional `videoClassName` for a responsive object-fit; `VideoGrid`'s connected branch wraps the main video in a backdrop + capped stage; a `.call-stage-bg` utility paints the theater backdrop; the room `<main>` goes dark.

**Tech Stack:** React 19, TS, Tailwind v4, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-30-call-desktop-theater-design.md` · **Branch:** `feat/call-desktop-theater`

---

## Conventions
- Commit author `git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>"`. No AI attribution. Conventional commits. Run `pnpm type-check && pnpm lint && pnpm test` before each commit.

---

### Task 1: VideoPlayer — optional `videoClassName`

**Files:** Modify `src/components/video/video-player.tsx`

- [ ] **Step 1: Add the prop and apply it to the `<video>`**

Read `src/components/video/video-player.tsx`. Make exactly these edits:

(a) In `interface VideoPlayerProps`, add a line:
```ts
  videoClassName?: string
```

(b) Add `videoClassName` to the destructured props in the `VideoPlayer` function signature (alongside `objectFit`).

(c) On the `<motion.video>` element, append `videoClassName` to its `cn(...)` so it reads:
```tsx
            className={cn(
              'w-full h-full',
              objectFit === 'cover' ? 'object-cover' : 'object-contain',
              videoClassName
            )}
```
Leave everything else (the outer-div `className` passthrough, mirror style, placeholder, `aria-label`) unchanged.

- [ ] **Step 2: Verify**

Run: `pnpm test src/components/video/video-player.test.tsx && pnpm type-check && pnpm lint`
Expected: PASS (the test asserts placeholder/label/mirror only — unaffected).

- [ ] **Step 3: Commit**
```bash
git add src/components/video/video-player.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: VideoPlayer videoClassName for responsive object-fit"
```

---

### Task 2: `.call-stage-bg` utility

**Files:** Modify `src/globals.css`

- [ ] **Step 1: Append the utility at the end of `src/globals.css`**
```css
/* ----------------------------------------------------------
   Active-call theater backdrop — solid dark on mobile; a dark
   warm radial depth on desktop, where the call is a centered stage.
   ---------------------------------------------------------- */
.call-stage-bg {
  background-color: #000;
}
@media (min-width: 1024px) {
  .call-stage-bg {
    background: radial-gradient(
      ellipse 75% 70% at 50% 45%,
      oklch(0.24 0.04 18),
      oklch(0.11 0.012 25)
    );
  }
}
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm build`
```bash
git add src/globals.css
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: add call-stage-bg theater backdrop utility"
```

---

### Task 3: VideoGrid theater stage + dark room background

**Files:** Modify `src/components/video/video-grid.tsx`; Modify `src/pages/room-page.tsx`

- [ ] **Step 1: Wrap the connected main video in a backdrop + stage**

In `src/components/video/video-grid.tsx`, replace this exact block (the main `VideoPlayer` inside the connected `<>` fragment):
```tsx
          <VideoPlayer
            stream={mainStream}
            muted={isLocalMain}
            mirror={isLocalMain && mirrorVideo}
            label={isLocalMain ? 'Your video' : 'Partner video'}
            objectFit="cover"
            className="absolute inset-0 h-full w-full rounded-none"
          />
```
with:
```tsx
          <div className="call-stage-bg absolute inset-0 flex items-center justify-center lg:p-8">
            <div className="relative h-full w-full overflow-hidden lg:h-auto lg:aspect-video lg:max-h-[86vh] lg:w-full lg:max-w-[1180px] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-glow">
              <VideoPlayer
                stream={mainStream}
                muted={isLocalMain}
                mirror={isLocalMain && mirrorVideo}
                label={isLocalMain ? 'Your video' : 'Partner video'}
                objectFit="cover"
                videoClassName="lg:object-contain"
                className="absolute inset-0 h-full w-full rounded-none bg-transparent"
              />
            </div>
          </div>
```
Leave the scrim `<div ... bg-black/10 ... />` and the entire `<motion.button>` PiP block exactly as they are (unchanged).

- [ ] **Step 2: Darken the room background**

In `src/pages/room-page.tsx`, find the connected-state `<main>` element (the one with `role="main" aria-label="Video call room"`). Change its background class `bg-[var(--background)]` to `bg-black` (only that one class on that element; do NOT change the camera-error or timeout early-return screens, which keep `bg-[var(--background)] bg-warm-gradient`).

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm lint && pnpm test src/components/video/video-grid.test.tsx`
Expected: PASS. The connected branch still renders the swap button (aria-labels unchanged), so the VideoGrid swap test passes; the waiting test is unaffected.

- [ ] **Step 4: Commit**
```bash
git add src/components/video/video-grid.tsx src/pages/room-page.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: desktop theater layout for the active call"
```

---

### Task 4: Final verification

- [ ] **Step 1:** Run the full loop:
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```
Expected: all green (125 unit / 21 e2e). No test changes were needed; this is a CSS/structure change.

- [ ] **Step 2:** If any gate fails in a way the plan didn't anticipate, STOP and report — do not alter PiP behavior, the reconnect machine, or weaken tests.

---

## Self-Review
**Spec coverage:** `videoClassName` for responsive object-fit → T1; `.call-stage-bg` backdrop → T2; centered capped `lg` stage + `object-contain` + dark room bg → T3; mobile full-bleed unchanged (base classes retained) → T3; PiP/scrim untouched → T3 (explicit); verification → T4. All mapped.
**Placeholders:** none.
**Type/markup consistency:** `videoClassName?: string` added in T1 is consumed in T3 (`videoClassName="lg:object-contain"`). The stage uses base `h-full w-full` (mobile full-bleed) overridden by `lg:` utilities (desktop theater) — no conflict (different breakpoints). `bg-transparent` on the main VideoPlayer lets `.call-stage-bg` show through the `object-contain` letterbox. The swap button block is preserved verbatim, so `video-grid.test` stays valid.
