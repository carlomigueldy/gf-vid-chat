# Design Enhancement & Responsive Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> For visual/styling tasks, consult the **frontend-design:frontend-design** skill for polish guidance — but the structure and tokens here are authoritative.

**Goal:** Elevate gf-vid-chat's "Soft + Warm" UI into a playful, characterful "Soft & Rounded" language (Fredoka + Plus Jakarta, pill buttons, rose-glow shadows, large radius) with a segmented-hero home, a glass-dock active call with a calm reconnect state, and a phone-first responsive layout — without touching P2P/reconnect logic.

**Architecture:** Pure presentation-layer changes on the existing Vite + React 19 + Tailwind v4 + Framer Motion SPA. A new reusable `SegmentedControl` primitive unifies the home Start/Join toggle, join-method switch, and settings theme picker. A new `usePreferences` hook (localStorage) backs the Settings "Defaults" card. Fonts are self-hosted via `@fontsource`. No backend, no new routes.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`), Framer Motion 12, lucide-react, Vitest + Testing Library, Playwright e2e. Self-hosted fonts via `@fontsource-variable/fredoka` and `@fontsource-variable/plus-jakarta-sans`.

**Spec:** `docs/superpowers/specs/2026-05-30-design-enhancement-responsive-design.md`
**Branch:** `feat/design-enhancement` (already created, off `main`).

---

## Conventions

- **Commit author:** `Carlo Miguel Dy <carlomigueldy@gmail.com>` (the gh-authenticated account). Every commit uses `git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>"`. NEVER add `Co-Authored-By` AI lines.
- **Commit style:** conventional commits (`feat:`, `refactor:`, `style:`, `test:`, `docs:`).
- **Per task:** run `pnpm type-check` and `pnpm lint` before committing; run `pnpm test` when the task touches a tested unit.
- **Visual tasks** (no meaningful unit test): the gate is `pnpm type-check && pnpm lint && pnpm build` plus a manual `pnpm dev` check at phone (≤480px), tablet (768px), and desktop (≥1280px) widths in light **and** dark mode.
- **Preserve these stable anchors** (e2e/unit depend on them — do NOT rename): QrDisplay `<figure aria-label="QR code to join room">`, the text `Scan to join`, the button `Copy join link`; the header brand link `aria-label="gf-vid-chat home"`, nav links `Home`/`Settings`, theme-toggle label `Switch to light/dark mode`; the paste input `aria-label="Room link or ID"` + placeholder `Paste room link or ID…` + button `Join Room`; RoomControls `role="toolbar" aria-label="Call controls"` and its button labels; `localStorage` key `gfvc-theme`.

### Shared interfaces (defined once, referenced by later tasks)

`SegmentedControl` (Task 7):
```tsx
export interface SegmentedOption<T extends string> {
  value: T
  label: string
  shortLabel?: string
  Icon?: React.ComponentType<{ className?: string }>
}
// <SegmentedControl options value onChange ariaLabel layoutId size? className? />
//   role="radiogroup"; options are role="radio"; arrow keys call onChange(next/prev)
```

`usePreferences` (Task 4):
```tsx
// returns { defaultTimeoutMs: number; setDefaultTimeoutMs(ms): void;
//           mirrorVideo: boolean; setMirrorVideo(on): void } — localStorage-backed
```

---

# Phase 1 — Foundation & Tokens

### Task 1: Self-host the display + body fonts

**Files:**
- Modify: `package.json` (add deps)
- Modify: `src/main.tsx:3` (font imports)
- Modify: `src/globals.css:1-3` (add `@theme` font tokens) and `:66-74` (body font-family)

- [ ] **Step 1: Install the font packages**

Run:
```bash
pnpm add @fontsource-variable/fredoka @fontsource-variable/plus-jakarta-sans
```
Expected: both packages added to `dependencies`.

- [ ] **Step 2: Import the fonts in `src/main.tsx`**

Add the two imports directly under the existing `import './globals.css'` line:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/plus-jakarta-sans'
import './globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Register font tokens in `src/globals.css`**

Insert an `@theme` block immediately after the `@custom-variant dark (...)` line (line 3):
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Plus Jakarta Sans Variable', system-ui, -apple-system, sans-serif;
  --font-display: 'Fredoka Variable', 'Plus Jakarta Sans Variable', system-ui, sans-serif;
}
```

- [ ] **Step 4: Use the body font token**

In the `@layer base` block, replace the body `font-family` line:
```css
  body {
    @apply bg-[var(--background)] text-[var(--foreground)];
    font-family: var(--font-sans);
  }
```

- [ ] **Step 5: Verify build picks up fonts**

Run: `pnpm type-check && pnpm build`
Expected: PASS; build output includes `.woff2` font assets.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/main.tsx src/globals.css
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: self-host Fredoka + Plus Jakarta fonts"
```

---

### Task 2: Add design tokens & utilities (gradient, glow, motion keyframes)

**Files:**
- Modify: `src/globals.css` (`:root`, `.dark`, utilities)

- [ ] **Step 1: Add gradient + glow tokens to `:root`**

In the `:root` block, after `--ring:` and before `--radius:`, add and bump radius:
```css
  --ring: oklch(0.65 0.18 12);
  --radius: 0.875rem;

  --primary-gradient: linear-gradient(135deg, oklch(0.70 0.17 12), oklch(0.62 0.21 8));
  --glow-primary: oklch(0.62 0.20 10 / 0.45);
```

- [ ] **Step 2: Add the dark-mode variants in `.dark`**

In the `.dark` block, after `--ring:` add:
```css
  --primary-gradient: linear-gradient(135deg, oklch(0.76 0.15 14), oklch(0.68 0.18 8));
  --glow-primary: oklch(0.72 0.16 12 / 0.42);
```

- [ ] **Step 3: Add utilities at the end of `src/globals.css`**

Append:
```css
/* ----------------------------------------------------------
   Elevated "Soft & Rounded" utilities
   ---------------------------------------------------------- */
.font-display { font-family: var(--font-display); }

.bg-primary-gradient { background-image: var(--primary-gradient); }

.shadow-glow {
  box-shadow: 0 12px 30px -8px var(--glow-primary), 0 2px 8px var(--shadow-color);
}

/* Breathing pulse — used by waiting + reconnect states */
@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.55; transform: scale(0.97); }
}
.animate-breathe { animation: breathe 2.4s ease-in-out infinite; }

/* QR viewfinder scan line */
@keyframes scanline {
  0%   { top: 10%; }
  50%  { top: 86%; }
  100% { top: 10%; }
}
.animate-scanline { animation: scanline 2.4s ease-in-out infinite; }
```

- [ ] **Step 4: Enrich the existing warm gradient**

Replace the `.bg-warm-gradient` light rule's color stop opacity (line ~84) from `0.40` to `0.55`:
```css
.bg-warm-gradient {
  background-image: radial-gradient(
    ellipse 80% 50% at 50% -5%,
    oklch(0.93 0.04 12 / 0.55),
    transparent
  );
}
```

- [ ] **Step 5: Verify**

Run: `pnpm build`
Expected: PASS (the existing `@media (prefers-reduced-motion)` block already neutralizes the new animations).

- [ ] **Step 6: Commit**

```bash
git add src/globals.css
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add gradient, glow, and motion utility tokens"
```

---

### Task 3: Add spring motion variants

**Files:**
- Modify: `src/lib/animations.ts`

- [ ] **Step 1: Retune `pageVariants` to a gentle spring and add new variants**

Replace `pageVariants` (lines 3-7) and append two exports at the end of the file:
```ts
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}
```
Append after `badgePop`:
```ts
export const panelSwap: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 30 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.12 } },
}

export const reconnectOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/animations.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add spring panel-swap and reconnect motion variants"
```

---

### Task 4: `usePreferences` hook (localStorage-backed defaults)

**Files:**
- Create: `src/hooks/use-preferences.ts`
- Test: `src/hooks/use-preferences.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/use-preferences.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreferences } from './use-preferences'

describe('usePreferences', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to 1 hr timeout and mirror on', () => {
    const { result } = renderHook(() => usePreferences())
    expect(result.current.defaultTimeoutMs).toBe(3_600_000)
    expect(result.current.mirrorVideo).toBe(true)
  })

  it('persists the default timeout to localStorage', () => {
    const { result } = renderHook(() => usePreferences())
    act(() => result.current.setDefaultTimeoutMs(600_000))
    expect(result.current.defaultTimeoutMs).toBe(600_000)
    expect(localStorage.getItem('gfvc-default-timeout')).toBe('600000')
  })

  it('persists the mirror toggle to localStorage', () => {
    const { result } = renderHook(() => usePreferences())
    act(() => result.current.setMirrorVideo(false))
    expect(result.current.mirrorVideo).toBe(false)
    expect(localStorage.getItem('gfvc-mirror-video')).toBe('false')
  })

  it('reads existing values from localStorage', () => {
    localStorage.setItem('gfvc-default-timeout', '1800000')
    localStorage.setItem('gfvc-mirror-video', 'false')
    const { result } = renderHook(() => usePreferences())
    expect(result.current.defaultTimeoutMs).toBe(1_800_000)
    expect(result.current.mirrorVideo).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/hooks/use-preferences.test.ts`
Expected: FAIL — cannot resolve `./use-preferences`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/use-preferences.ts`:
```ts
import { useCallback, useState } from 'react'

const TIMEOUT_KEY = 'gfvc-default-timeout'
const MIRROR_KEY = 'gfvc-mirror-video'
const DEFAULT_TIMEOUT_MS = 3_600_000

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : fallback
  } catch {
    return fallback
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

export function usePreferences() {
  const [defaultTimeoutMs, setTimeoutState] = useState(() =>
    readNumber(TIMEOUT_KEY, DEFAULT_TIMEOUT_MS)
  )
  const [mirrorVideo, setMirrorState] = useState(() => readBool(MIRROR_KEY, true))

  const setDefaultTimeoutMs = useCallback((ms: number) => {
    setTimeoutState(ms)
    try {
      localStorage.setItem(TIMEOUT_KEY, String(ms))
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  const setMirrorVideo = useCallback((on: boolean) => {
    setMirrorState(on)
    try {
      localStorage.setItem(MIRROR_KEY, String(on))
    } catch {
      // storage unavailable — keep in-memory value
    }
  }, [])

  return { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/hooks/use-preferences.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-preferences.ts src/hooks/use-preferences.test.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add usePreferences hook for default timeout and mirror"
```

---

# Phase 2 — Primitives

### Task 5: Restyle the `Card` primitive (rounded-3xl, soft glow, no border)

**Files:**
- Modify: `src/components/ui/card.tsx:9-13`

- [ ] **Step 1: Update the `Card` root classes**

Replace the className in the `Card` function:
```tsx
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-[var(--card)] text-[var(--card-foreground)] shadow-warm-md',
        className
      )}
      {...props}
    />
  )
}
```
Leave `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` unchanged.

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm test src/components` && `pnpm build`
Expected: PASS (no card test asserts the border/`rounded-lg`).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: soften Card to rounded-3xl with warm glow shadow"
```

---

### Task 6: Pill + gradient + glow `Button`

**Files:**
- Modify: `src/components/ui/button.tsx:4-33`

- [ ] **Step 1: Replace `buttonVariants`**

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,box-shadow,filter] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-gradient text-[var(--primary-foreground)] shadow-glow hover:brightness-[1.05]',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:brightness-[1.05]',
        outline:
          'border border-[var(--input)] bg-[var(--card)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80',
        ghost:
          'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 rounded-full px-5 py-2 text-sm',
        sm: 'h-9 rounded-full px-4 text-sm',
        lg: 'h-12 rounded-full px-7 text-base font-semibold',
        icon: 'size-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```
Leave the `ButtonProps` interface and `Button` function body unchanged.

- [ ] **Step 2: Verify existing button-dependent tests still pass**

Run: `pnpm test src/components/room/create-room.test.tsx src/components/room/room-controls.test.tsx`
Expected: PASS. (RoomControls toggle buttons set their own `red` classes via `cn`; that test is unaffected. Task 15 will rewrite RoomControls to use explicit `variant="ghost"` so no `default` gradient leaks onto toggles.)

- [ ] **Step 3: Visual check + commit**

Run: `pnpm type-check && pnpm lint && pnpm build`
```bash
git add src/components/ui/button.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: make Button a glowing rose-gradient pill"
```

---

### Task 7: `SegmentedControl` primitive

**Files:**
- Create: `src/components/ui/segmented-control.tsx`
- Test: `src/components/ui/segmented-control.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/segmented-control.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SegmentedControl, type SegmentedOption } from './segmented-control'

type V = 'a' | 'b' | 'c'
const OPTIONS: SegmentedOption<V>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
]

function setup(value: V = 'a') {
  const onChange = vi.fn()
  render(
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      ariaLabel="Test group"
      layoutId="test-thumb"
    />
  )
  return { onChange }
}

describe('SegmentedControl', () => {
  it('renders a radiogroup with one radio per option', () => {
    setup()
    const group = screen.getByRole('radiogroup', { name: 'Test group' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('marks the selected option with aria-checked', () => {
    setup('b')
    expect(screen.getByRole('radio', { name: 'Bravo' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when a radio is clicked', () => {
    const { onChange } = setup('a')
    fireEvent.click(screen.getByRole('radio', { name: 'Charlie' }))
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('moves selection with ArrowRight / ArrowLeft', () => {
    const { onChange } = setup('a')
    const selected = screen.getByRole('radio', { name: 'Alpha' })
    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
    fireEvent.keyDown(selected, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('c') // wraps to last
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/ui/segmented-control.test.tsx`
Expected: FAIL — cannot resolve `./segmented-control`.

- [ ] **Step 3: Implement the component**

Create `src/components/ui/segmented-control.tsx`:
```tsx
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  shortLabel?: string
  Icon?: React.ComponentType<{ className?: string }>
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  layoutId: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  layoutId,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const reduce = useReducedMotion()
  const index = options.findIndex((o) => o.value === value)

  function move(delta: number) {
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('relative flex w-full rounded-full bg-[var(--muted)] p-1', className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        const Icon = opt.Icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              size === 'md' ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
              selected
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-full bg-[var(--card)] shadow-warm"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {opt.shortLabel ? (
              <>
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.shortLabel}</span>
              </>
            ) : (
              opt.label
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/ui/segmented-control.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/segmented-control.tsx src/components/ui/segmented-control.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: add reusable SegmentedControl primitive"
```

---

# Phase 3 — Global Chrome

### Task 8: Floating header + animated theme toggle

**Files:**
- Modify: `src/components/layout/header.tsx`
- Test: `src/components/layout/header.test.tsx` (no change expected — verify it still passes)

- [ ] **Step 1: Rewrite `header.tsx`**

Replace the whole file:
```tsx
import { motion, useReducedMotion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

export function Header() {
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const reduce = useReducedMotion()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function handleToggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  const navLink = (to: string, label: string, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      aria-current={location.pathname === to ? 'page' : undefined}
      className={({ isActive }) =>
        cn(
          'text-sm transition-colors duration-150',
          isActive
            ? 'text-[var(--primary)] font-semibold'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )
      }
    >
      {label}
    </NavLink>
  )

  return (
    <header role="banner" className="sticky top-0 z-50 px-4 pt-3 md:pt-4">
      <div
        className="mx-auto flex h-12 w-full max-w-screen-lg items-center justify-between
          rounded-full border border-[var(--border)] bg-[var(--card)]/80 px-4 backdrop-blur-md
          shadow-warm lg:max-w-2xl"
      >
        <Link
          to="/"
          className="group inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight text-[var(--foreground)] transition-opacity duration-150 hover:opacity-80"
          aria-label="gf-vid-chat home"
        >
          <span
            className="size-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_0_4px_var(--glow-primary)]"
            aria-hidden="true"
          />
          gf&#8209;vid&#8209;chat
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-4">
          {navLink('/', 'Home', true)}
          {navLink('/settings', 'Settings')}
        </nav>

        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex size-9 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <motion.span
            key={isDark ? 'sun' : 'moon'}
            initial={reduce ? false : { rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-flex"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </motion.span>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify the existing header test still passes**

Run: `pnpm test src/components/layout/header.test.tsx`
Expected: PASS (banner, brand `gf-vid-chat home`, nav links Home/Settings, toggle `/switch to/i`, focusable — all preserved).

- [ ] **Step 3: Visual check + commit**

Run: `pnpm type-check && pnpm lint && pnpm build`
```bash
git add src/components/layout/header.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: floating pill header with rose dot and animated theme toggle"
```

---

# Phase 4 — Home (Segmented Hero)

### Task 9: Refactor `CreateRoom` into a panel

**Files:**
- Modify: `src/components/room/create-room.tsx`
- Modify: `src/components/room/create-room.test.tsx`

- [ ] **Step 1: Update the test first**

Replace `src/components/room/create-room.test.tsx` (drop the removed title/description assertions; keep behavior):
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CreateRoom } from './create-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('nanoid', () => ({ nanoid: () => 'testroom123' }))

function renderCreateRoom() {
  return render(
    <MemoryRouter>
      <CreateRoom />
    </MemoryRouter>
  )
}

describe('CreateRoom', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  it('renders the timeout slider with accessible label', () => {
    renderCreateRoom()
    expect(screen.getByRole('slider', { name: 'Auto-reconnect timeout' })).toBeInTheDocument()
  })

  it('shows range labels for 5 min and 2 hr', () => {
    renderCreateRoom()
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('2 hr')).toBeInTheDocument()
  })

  it('shows default timeout of 1 hr', () => {
    renderCreateRoom()
    expect(screen.getAllByText('1 hr').length).toBeGreaterThan(0)
  })

  it('renders Create Room button', () => {
    renderCreateRoom()
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
  })

  it('navigates with creator role and timeout on button click', () => {
    renderCreateRoom()
    fireEvent.click(screen.getByRole('button', { name: /create room/i }))
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/room/testroom123?role=creator&timeout=')
    )
  })

  it('updates displayed timeout when slider changes', () => {
    renderCreateRoom()
    const slider = screen.getByRole('slider', { name: 'Auto-reconnect timeout' })
    fireEvent.change(slider, { target: { value: '600000' } })
    expect(screen.getAllByText('10 min').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/room/create-room.test.tsx`
Expected: FAIL — current component still renders title; new helper text/markup differs (and `usePreferences` not yet wired). (Some assertions may pass; the suite as a whole should be red until Step 3.)

- [ ] **Step 3: Rewrite `create-room.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePreferences } from '@/hooks/use-preferences'

const MIN_MS = 300_000   // 5 min
const MAX_MS = 7_200_000 // 2 hr
const STEP_MS = 300_000  // 5 min

function formatDuration(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hr' : `${hours} hr`
}

export function CreateRoom() {
  const { defaultTimeoutMs } = usePreferences()
  const [timeoutMs, setTimeoutMs] = useState(defaultTimeoutMs)
  const navigate = useNavigate()

  function handleCreate() {
    const roomId = nanoid(10)
    navigate(`/room/${roomId}?role=creator&timeout=${timeoutMs}`)
  }

  const displayValue = formatDuration(timeoutMs)
  const pct = ((timeoutMs - MIN_MS) / (MAX_MS - MIN_MS)) * 100

  return (
    <Card className="p-6 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="timeout-slider" className="text-sm font-medium text-[var(--foreground)]">
            Auto-reconnect for
          </label>
          <span
            className="font-display text-sm font-semibold text-[var(--primary)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {displayValue}
          </span>
        </div>

        <input
          id="timeout-slider"
          type="range"
          min={MIN_MS}
          max={MAX_MS}
          step={STEP_MS}
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
          aria-label="Auto-reconnect timeout"
          aria-valuetext={displayValue}
          style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--secondary) ${pct}%)` }}
          className="w-full h-2.5 appearance-none rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:shadow-warm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        />

        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1.5">
          <span>5 min</span>
          <span>2 hr</span>
        </div>
      </div>

      <p className="text-sm text-[var(--muted-foreground)] text-center text-balance">
        If the connection drops, we keep quietly retrying for up to{' '}
        <span className="font-medium text-[var(--foreground)]">{displayValue}</span>.
      </p>

      <Button onClick={handleCreate} size="lg" className="w-full">
        Create Room <span aria-hidden="true">✨</span>
      </Button>
    </Card>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/room/create-room.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/room/create-room.tsx src/components/room/create-room.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "refactor: CreateRoom as titleless panel with prefs default + glow CTA"
```

---

### Task 10: Refactor `JoinRoom` into a panel using `SegmentedControl`

**Files:**
- Modify: `src/components/room/join-room.tsx`
- Modify: `src/components/room/join-room.test.tsx`

- [ ] **Step 1: Update the test first**

Replace `src/components/room/join-room.test.tsx` (tabs → radios; titles removed):
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JoinRoom } from './join-room'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/components/qr/qr-scanner', () => ({
  QrScanner: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/abc123?role=joiner')}>Mock scan</button>
  ),
}))
vi.mock('@/components/qr/qr-upload', () => ({
  QrUpload: ({ onResult }: { onResult: (url: string) => void }) => (
    <button onClick={() => onResult('https://example.com/room/xyz456?role=joiner')}>Mock upload</button>
  ),
}))

function renderJoinRoom() {
  return render(
    <MemoryRouter>
      <JoinRoom />
    </MemoryRouter>
  )
}

describe('JoinRoom', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders three method options', () => {
    renderJoinRoom()
    const group = screen.getByRole('radiogroup', { name: 'Join method' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('Scan method is selected by default', () => {
    renderJoinRoom()
    expect(screen.getByRole('radio', { name: /scan/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('switches to Paste method on click', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    expect(screen.getByPlaceholderText('Paste room link or ID…')).toBeInTheDocument()
  })

  it('shows error when pasting invalid input', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: '!!' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('navigates to room on valid room ID paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: 'abc1234567' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc1234567?role=joiner')
  })

  it('navigates to room on valid full URL paste', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /paste/i }))
    fireEvent.change(screen.getByPlaceholderText('Paste room link or ID…'), { target: { value: 'https://example.com/room/room1234?role=joiner' } })
    fireEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/room1234?role=joiner')
  })

  it('navigates via QrScanner result (default method)', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('button', { name: 'Mock scan' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc123?role=joiner')
  })

  it('navigates via Upload result', () => {
    renderJoinRoom()
    fireEvent.click(screen.getByRole('radio', { name: /upload/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Mock upload' }))
    expect(mockNavigate).toHaveBeenCalledWith('/room/xyz456?role=joiner')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/room/join-room.test.tsx`
Expected: FAIL — current component renders `role="tab"`, not `radiogroup`/`radio`.

- [ ] **Step 3: Rewrite `join-room.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Upload, Link } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { QrScanner } from '@/components/qr/qr-scanner'
import { QrUpload } from '@/components/qr/qr-upload'

type Method = 'scan' | 'upload' | 'paste'

const METHODS: SegmentedOption<Method>[] = [
  { value: 'scan', label: 'Scan', Icon: ScanLine },
  { value: 'upload', label: 'Upload', Icon: Upload },
  { value: 'paste', label: 'Paste', Icon: Link },
]

function extractRoomId(input: string): string | null {
  input = input.trim()
  try {
    const url = new URL(input)
    const match = url.pathname.match(/\/room\/([^/?]+)/)
    if (match) return match[1]
  } catch {
    // not a URL — treat as raw room ID
  }
  if (/^[a-zA-Z0-9_-]{4,30}$/.test(input)) return input
  return null
}

export function JoinRoom() {
  const [method, setMethod] = useState<Method>('scan')
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const navigate = useNavigate()

  function handleJoin(url: string) {
    const roomId = extractRoomId(url)
    if (roomId) navigate(`/room/${roomId}?role=joiner`)
  }

  function handlePasteJoin() {
    setPasteError('')
    const roomId = extractRoomId(pasteValue)
    if (roomId) {
      navigate(`/room/${roomId}?role=joiner`)
    } else {
      setPasteError('Please enter a valid room link or room ID.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handlePasteJoin()
  }

  return (
    <Card className="p-6 space-y-4">
      <SegmentedControl
        options={METHODS}
        value={method}
        onChange={setMethod}
        ariaLabel="Join method"
        layoutId="join-method-thumb"
        size="sm"
      />

      <div>
        {method === 'scan' && <QrScanner onResult={handleJoin} />}
        {method === 'upload' && <QrUpload onResult={handleJoin} />}
        {method === 'paste' && (
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <input
                type="text"
                value={pasteValue}
                onChange={(e) => {
                  setPasteValue(e.target.value)
                  setPasteError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste room link or ID…"
                aria-label="Room link or ID"
                aria-describedby={pasteError ? 'paste-error' : undefined}
                aria-invalid={pasteError ? true : undefined}
                className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
              />
              {pasteError && (
                <p id="paste-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                  {pasteError}
                </p>
              )}
            </div>
            <Button onClick={handlePasteJoin} className="w-full" disabled={!pasteValue.trim()}>
              Join Room
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/room/join-room.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/room/join-room.tsx src/components/room/join-room.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "refactor: JoinRoom panel using SegmentedControl for method switch"
```

---

### Task 11: HomePage segmented hero

**Files:**
- Modify: `src/pages/home-page.tsx`
- Test: `src/pages/home-page.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `src/pages/home-page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './home-page'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})
vi.mock('@/components/qr/qr-scanner', () => ({ QrScanner: () => <div>scanner</div> }))
vi.mock('@/components/qr/qr-upload', () => ({ QrUpload: () => <div>upload</div> }))

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  it('renders the hero heading', () => {
    renderHome()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/stay close/i)
  })

  it('shows Start and Join as a segmented control with Start selected by default', () => {
    renderHome()
    expect(screen.getByRole('radiogroup', { name: /start or join/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /start a room/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument()
  })

  it('switches to the Join panel when "Join a room" is selected', () => {
    renderHome()
    fireEvent.click(screen.getByRole('radio', { name: /join a room/i }))
    expect(screen.getByRole('radiogroup', { name: 'Join method' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/home-page.test.tsx`
Expected: FAIL — current home renders two cards, no Start/Join radiogroup, heading is "gf-vid-chat".

- [ ] **Step 3: Rewrite `home-page.tsx`**

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/page-container'
import { CreateRoom } from '@/components/room/create-room'
import { JoinRoom } from '@/components/room/join-room'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { pageVariants, panelSwap } from '@/lib/animations'

type Mode = 'start' | 'join'

const MODE_OPTIONS: SegmentedOption<Mode>[] = [
  { value: 'start', label: 'Start a room' },
  { value: 'join', label: 'Join a room' },
]

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('start')

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 bg-warm-gradient"
    >
      <PageContainer className="max-w-md">
        <main>
          <section className="text-center mb-7 mt-2 md:mt-6">
            <h1 className="font-display font-semibold tracking-tight text-[var(--foreground)] text-[clamp(1.9rem,7vw,2.75rem)] leading-[1.05]">
              Stay close,
              <br />
              even asleep. <span aria-hidden="true">💗</span>
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)] text-balance">
              No accounts. No servers. Just you two — and a connection that mends itself all night.
            </p>
          </section>

          <SegmentedControl
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
            ariaLabel="Start or join a room"
            layoutId="home-mode-thumb"
            className="mb-5"
          />

          <AnimatePresence mode="wait">
            <motion.div key={mode} variants={panelSwap} initial="initial" animate="animate" exit="exit">
              {mode === 'start' ? <CreateRoom /> : <JoinRoom />}
            </motion.div>
          </AnimatePresence>
        </main>
      </PageContainer>
    </motion.div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/home-page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Full unit suite + visual check + commit**

Run: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
Manually `pnpm dev`: confirm hero + toggle swaps Start/Join in place at phone/tablet/desktop, light + dark.
```bash
git add src/pages/home-page.tsx src/pages/home-page.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: segmented-hero home page with animated Start/Join panels"
```

---

# Phase 5 — Join + QR Flows

### Task 12: QrDisplay — glow card + heart center mark

**Files:**
- Modify: `src/components/qr/qr-display.tsx`

> Note: `qrcode.react` v4 does not support rounded modules; we keep square modules and add a small excavated heart logo via `imageSettings` (with `level="H"` for error-correction headroom). Preserve `figure aria-label="QR code to join room"`, `Scan to join`, and `Copy join link`.

- [ ] **Step 1: Rewrite `qr-display.tsx`**

```tsx
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { qrReveal } from '@/lib/animations'

interface QrDisplayProps {
  url: string
  size?: number
}

// Small rose heart, inlined as a data URI for the QR center mark.
const HEART_MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e0457b'%3E%3Cpath d='M12 21s-8-4.6-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 5.4-8 10-8 10z'/%3E%3C/svg%3E"

export function QrDisplay({ url, size = 220 }: QrDisplayProps) {
  const [copied, setCopied] = useState(false)
  const truncatedUrl = url.length > 40 ? `${url.slice(0, 40)}…` : url

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access denied — silently fail
    }
  }

  return (
    <figure aria-label="QR code to join room" className="flex flex-col items-center gap-3 p-6">
      <motion.div
        variants={qrReveal}
        initial="initial"
        animate="animate"
        className="rounded-3xl bg-white p-4 shadow-glow"
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          imageSettings={{ src: HEART_MARK, height: 34, width: 34, excavate: true }}
        />
      </motion.div>

      <figcaption className="sr-only">Scan to join or share the link below</figcaption>

      <p className="font-display text-sm font-semibold text-[var(--foreground)]">Scan to join</p>

      <p className="max-w-[260px] break-all text-center font-mono text-xs text-[var(--muted-foreground)]">
        {truncatedUrl}
      </p>

      <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy join link" className="gap-1.5">
        {copied ? (
          <>
            <Check className="size-3" /> Copied!
          </>
        ) : (
          <>
            <Copy className="size-3" /> Copy link
          </>
        )}
      </Button>
    </figure>
  )
}
```

- [ ] **Step 2: Verify e2e anchors unchanged + build**

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: PASS. (`figure` label, `Scan to join`, `Copy join link` intact → create-room e2e still valid.)

- [ ] **Step 3: Commit**

```bash
git add src/components/qr/qr-display.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: QR display in a glow card with heart center mark"
```

---

### Task 13: QrScanner — rounded viewfinder + animated scan line

**Files:**
- Modify: `src/components/qr/qr-scanner.tsx:76-115` (the returned JSX only — keep all logic/effects/labels)

- [ ] **Step 1: Replace the viewfinder block**

Replace the `return (...)` JSX (the outer region wrapper and inner viewfinder), keeping `containerId`, `state`, `errorMsg`, and the live region exactly as-is:
```tsx
  return (
    <div role="region" aria-label="QR code camera scanner" className="flex flex-col items-center gap-3">
      <div className="relative aspect-square w-full max-w-64 overflow-hidden rounded-3xl bg-[var(--muted)] shadow-warm-md">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 text-[var(--muted-foreground)] animate-spin" />
          </div>
        )}
        <div id={containerId} className="h-full w-full" aria-label="Camera viewfinder" />

        {state === 'scanning' && (
          <>
            <div className="pointer-events-none absolute top-3 left-3 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[var(--primary)]" />
            <div className="pointer-events-none absolute top-3 right-3 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[var(--primary)]" />
            <div className="pointer-events-none absolute bottom-3 left-3 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[var(--primary)]" />
            <div className="pointer-events-none absolute bottom-3 right-3 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[var(--primary)]" />
            <div className="animate-scanline pointer-events-none absolute left-4 right-4 h-0.5 rounded-full bg-[var(--primary)]/70 shadow-[0_0_8px_var(--glow-primary)]" />
          </>
        )}
      </div>

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMsg}
          </p>
          <Button variant="ghost" size="sm" onClick={startScanner}>
            Retry
          </Button>
        </div>
      )}

      {state === 'scanning' && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] text-center">Point camera at QR code</p>
      )}

      <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  )
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/qr/qr-scanner.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: rounded QR viewfinder with animated scan line"
```

---

### Task 14: QrUpload — rounded drop-zone with glow on drag

**Files:**
- Modify: `src/components/qr/qr-upload.tsx:109-118` (the `<label>` className only)

- [ ] **Step 1: Update the drop-zone label classes**

Replace the `cn(...)` in the `<label className={cn(...)}>`:
```tsx
        className={cn(
          'block cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-colors duration-150',
          isDragging
            ? 'border-[var(--primary)] bg-[var(--accent)] shadow-glow'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)]'
        )}
```
Leave all handlers, the input, the state-driven content, and the live region unchanged.

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/qr/qr-upload.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: rounded QR upload drop-zone with glow on drag"
```

---

# Phase 6 — Active Call

### Task 15: RoomControls — glass dock, safe-area, ghost toggles

**Files:**
- Modify: `src/components/room/room-controls.tsx` (JSX/classes only — keep auto-hide logic, props, labels, behavior)

- [ ] **Step 1: Replace the returned JSX**

Keep imports, the `HIDE_DELAY_MS` constant, the `useState`/`useEffect` auto-hide logic, and the `AnimatePresence` wrapper. Replace the inner `<motion.div>`...`</motion.div>` so the dock is glassy, uses safe-area padding, and uses explicit `variant="ghost"` toggles:
```tsx
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={controlsSlideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed bottom-0 left-1/2 z-30 -translate-x-1/2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <div
            role="toolbar"
            aria-label="Call controls"
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[var(--card)]/70 px-4 py-2.5 shadow-glow backdrop-blur-xl"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMic}
              aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={!isMicOn}
              className={cn(
                'size-11 rounded-full',
                !isMicOn && 'bg-red-500/15 text-red-500 hover:bg-red-500/25 hover:text-red-500'
              )}
            >
              {isMicOn ? <Mic className="size-5" aria-hidden="true" /> : <MicOff className="size-5" aria-hidden="true" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCamera}
              aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              aria-pressed={!isCameraOn}
              className={cn(
                'size-11 rounded-full',
                !isCameraOn && 'bg-red-500/15 text-red-500 hover:bg-red-500/25 hover:text-red-500'
              )}
            >
              {isCameraOn ? <Video className="size-5" aria-hidden="true" /> : <VideoOff className="size-5" aria-hidden="true" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="size-11 rounded-full"
            >
              {isFullscreen ? <Minimize className="size-5" aria-hidden="true" /> : <Maximize className="size-5" aria-hidden="true" />}
            </Button>

            <div className="mx-1 h-6 w-px bg-[var(--border)]" aria-hidden="true" />

            <button
              type="button"
              onClick={onHangUp}
              aria-label="End call"
              className="flex size-11 items-center justify-center rounded-full bg-[var(--destructive)] text-white shadow-[0_6px_16px_-4px_oklch(0.6_0.24_20_/_0.6)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)] focus-visible:ring-offset-2"
            >
              <PhoneOff className="size-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
```

- [ ] **Step 2: Verify the existing test still passes**

Run: `pnpm test src/components/room/room-controls.test.tsx`
Expected: PASS (toolbar, all labels, click handlers, mic-off still contains `red`).

- [ ] **Step 3: Commit**

```bash
git add src/components/room/room-controls.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: glassy floating control dock with safe-area inset"
```

---

### Task 16: VideoGrid — draggable PiP, tap-to-swap, mirror preference

**Files:**
- Modify: `src/components/video/video-grid.tsx`
- Test: `src/components/video/video-grid.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `src/components/video/video-grid.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoGrid } from './video-grid'

function fakeStream() {
  return {} as unknown as MediaStream
}

describe('VideoGrid', () => {
  beforeEach(() => localStorage.clear())

  it('shows the waiting state with the QR code while waiting', () => {
    render(
      <VideoGrid localStream={null} remoteStream={null} roomUrl="https://x/room/abc" connectionState="waiting" />
    )
    expect(screen.getByRole('figure', { name: /QR code to join room/i })).toBeInTheDocument()
    expect(screen.getByText(/waiting for your partner/i)).toBeInTheDocument()
  })

  it('renders a PiP swap control when connected and swaps on click', () => {
    render(
      <VideoGrid
        localStream={fakeStream()}
        remoteStream={fakeStream()}
        roomUrl="https://x/room/abc"
        connectionState="connected"
      />
    )
    const swap = screen.getByRole('button', { name: /show your video full screen/i })
    expect(swap).toBeInTheDocument()
    fireEvent.click(swap)
    expect(screen.getByRole('button', { name: /show partner video full screen/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/video/video-grid.test.tsx`
Expected: FAIL — no swap button exists yet.

- [ ] **Step 3: Rewrite `video-grid.tsx`**

```tsx
import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { VideoPlayer } from './video-player'
import { QrDisplay } from '@/components/qr/qr-display'
import { usePreferences } from '@/hooks/use-preferences'
import type { ConnectionState } from '@/types'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  roomUrl: string
  connectionState: ConnectionState
}

const WAITING_STATES: ConnectionState[] = ['initializing', 'waiting']

export function VideoGrid({ localStream, remoteStream, roomUrl, connectionState }: VideoGridProps) {
  const isWaiting = WAITING_STATES.includes(connectionState)
  const { mirrorVideo } = usePreferences()
  const [isLocalMain, setIsLocalMain] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const mainStream = isLocalMain ? localStream : remoteStream
  const pipStream = isLocalMain ? remoteStream : localStream
  const pipIsLocal = !isLocalMain

  return (
    <div ref={containerRef} role="main" aria-label="Video call" className="relative h-full w-full overflow-hidden">
      <p aria-live="polite" className="sr-only">
        {isWaiting ? 'Waiting for your partner to join' : `Call status: ${connectionState}`}
      </p>

      {isWaiting ? (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[var(--background)] bg-warm-gradient px-4">
          <h1 className="sr-only">Active video call</h1>
          <QrDisplay url={roomUrl} />
          <p className="animate-breathe text-sm text-[var(--muted-foreground)]">Waiting for your partner…</p>
        </div>
      ) : (
        <>
          <VideoPlayer
            stream={mainStream}
            muted={isLocalMain}
            mirror={isLocalMain && mirrorVideo}
            label={isLocalMain ? 'Your video' : 'Partner video'}
            objectFit="cover"
            className="absolute inset-0 h-full w-full rounded-none"
          />

          <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />

          <motion.button
            type="button"
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            dragElastic={0.08}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            onClick={() => setIsLocalMain((v) => !v)}
            aria-label={pipIsLocal ? 'Show your video full screen' : 'Show partner video full screen'}
            className="absolute bottom-28 right-4 z-10 h-40 w-28 cursor-grab overflow-hidden rounded-2xl border-2 border-white/30 shadow-glow active:cursor-grabbing md:h-52 md:w-36"
          >
            <span className="absolute left-1/2 top-1.5 z-10 h-1 w-8 -translate-x-1/2 rounded-full bg-white/50" aria-hidden="true" />
            <VideoPlayer
              stream={pipStream}
              muted
              mirror={pipIsLocal && mirrorVideo}
              label={pipIsLocal ? 'Your video' : 'Partner video'}
              objectFit="cover"
              className="pointer-events-none h-full w-full rounded-none"
            />
          </motion.button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/video/video-grid.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/video/video-grid.tsx src/components/video/video-grid.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: draggable PiP with tap-to-swap and mirror preference"
```

---

### Task 17: ConnectionStatus — calmer styling (no logic/text change)

**Files:**
- Modify: `src/components/video/connection-status.tsx:34-75` (`STATE_CONFIG` colorClasses only)

- [ ] **Step 1: Soften the status colors**

Replace each `colorClasses` string in `STATE_CONFIG` with calmer, glassier tints (keep every `text`, `icon`, `spin`, `pulse`, and the `formatTime` logic unchanged):
```tsx
const STATE_CONFIG: Record<ConnectionState, StateConfig> = {
  initializing: {
    icon: Loader2,
    text: 'Initializing…',
    colorClasses: 'bg-[var(--card)]/70 text-[var(--muted-foreground)] border-white/10',
    spin: true,
  },
  waiting: {
    icon: Clock,
    text: 'Waiting for partner…',
    colorClasses: 'bg-[var(--card)]/70 text-[var(--primary)] border-white/10',
    pulse: true,
  },
  connecting: {
    icon: Loader2,
    text: 'Connecting…',
    colorClasses: 'bg-[var(--card)]/70 text-[var(--muted-foreground)] border-white/10',
    spin: true,
  },
  connected: {
    icon: CheckCircle2,
    text: 'Connected',
    colorClasses: 'bg-[var(--card)]/70 text-green-600 dark:text-green-400 border-white/10',
  },
  reconnecting: {
    icon: RefreshCw,
    text: 'Reconnecting…',
    colorClasses: 'bg-[var(--card)]/70 text-[var(--primary)] border-white/10',
    spin: true,
    pulse: true,
  },
  failed: {
    icon: XCircle,
    text: 'Connection lost',
    colorClasses: 'bg-[var(--card)]/70 text-red-600 dark:text-red-400 border-white/10',
  },
  timeout: {
    icon: Clock,
    text: 'Session ended',
    colorClasses: 'bg-[var(--card)]/70 text-red-600 dark:text-red-400 border-white/10',
  },
}
```

- [ ] **Step 2: Verify the existing test still passes**

Run: `pnpm test src/components/video/connection-status.test.tsx`
Expected: PASS (all texts and behavior unchanged).

- [ ] **Step 3: Commit**

```bash
git add src/components/video/connection-status.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "style: calmer glassy connection-status pill"
```

---

### Task 18: ReconnectOverlay component

**Files:**
- Create: `src/components/video/reconnect-overlay.tsx`
- Test: `src/components/video/reconnect-overlay.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/video/reconnect-overlay.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReconnectOverlay } from './reconnect-overlay'

describe('ReconnectOverlay', () => {
  it('renders a reassuring status message', () => {
    render(<ReconnectOverlay />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/hang tight/i)).toBeInTheDocument()
    expect(screen.getByText(/reconnecting you/i)).toBeInTheDocument()
  })

  it('shows the attempt number when retryCount > 0', () => {
    render(<ReconnectOverlay retryCount={3} />)
    expect(screen.getByText(/attempt 3/i)).toBeInTheDocument()
  })

  it('omits the attempt line when retryCount is 0', () => {
    render(<ReconnectOverlay retryCount={0} />)
    expect(screen.queryByText(/attempt/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/video/reconnect-overlay.test.tsx`
Expected: FAIL — cannot resolve `./reconnect-overlay`.

- [ ] **Step 3: Implement the component**

Create `src/components/video/reconnect-overlay.tsx`:
```tsx
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { reconnectOverlay } from '@/lib/animations'

interface ReconnectOverlayProps {
  retryCount?: number
}

export function ReconnectOverlay({ retryCount = 0 }: ReconnectOverlayProps) {
  return (
    <motion.div
      variants={reconnectOverlay}
      initial="initial"
      animate="animate"
      exit="exit"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <div
        className="animate-breathe absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_70%_at_50%_45%,var(--glow-primary),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="animate-breathe flex size-16 items-center justify-center rounded-full border-2 border-[var(--primary)]/50">
        <Heart className="size-7 fill-[var(--primary)] text-[var(--primary)]" aria-hidden="true" />
      </div>
      <p className="font-display text-xl font-semibold text-white drop-shadow">Hang tight…</p>
      <p className="max-w-xs text-sm text-white/85 drop-shadow">
        We lost the connection, but we're quietly reconnecting you.
        {retryCount > 0 && (
          <>
            <br />
            Attempt {retryCount}.
          </>
        )}
      </p>
    </motion.div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/video/reconnect-overlay.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/video/reconnect-overlay.tsx src/components/video/reconnect-overlay.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: calm breathing ReconnectOverlay"
```

---

### Task 19: RoomPage — 100dvh, overlay wiring, gentle end states

**Files:**
- Modify: `src/pages/room-page.tsx`

- [ ] **Step 1: Rewrite `room-page.tsx`**

Keep all hooks/logic (`useMediaStream`, `usePeer`, fullscreen handling, `parseRole`, `buildRoomUrl`, `DEFAULT_TIMEOUT_MS`). Update the error/timeout screens to gentle cards, add the reconnect overlay, switch `h-screen`→`h-[100dvh]`, and use a warm background:
```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { CameraOff, Clock } from 'lucide-react'
import { useMediaStream } from '@/hooks/use-media-stream'
import { usePeer } from '@/hooks/use-peer'
import { VideoGrid } from '@/components/video/video-grid'
import { ConnectionStatus } from '@/components/video/connection-status'
import { ReconnectOverlay } from '@/components/video/reconnect-overlay'
import { RoomControls } from '@/components/room/room-controls'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types'

const DEFAULT_TIMEOUT_MS = 3_600_000 // 1 hr

function parseRole(value: string | null): Role {
  return value === 'joiner' ? 'joiner' : 'creator'
}

function buildRoomUrl(roomId: string): string {
  const base = window.location.origin
  return `${base}/room/${roomId}?role=joiner`
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const role = parseRole(searchParams.get('role'))
  const retryTimeoutMs = Number(searchParams.get('timeout')) || DEFAULT_TIMEOUT_MS

  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    stream: localStream,
    error: mediaError,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
  } = useMediaStream()

  const { remoteStream, connectionState, retryCount, timeRemainingMs, disconnect } = usePeer({
    roomId: roomId ?? '',
    role,
    localStream,
    retryTimeoutMs,
  })

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // fullscreen not supported — silently ignore
    }
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function handleHangUp() {
    disconnect()
    navigate('/')
  }

  // ── Error: camera denied ────────────────────────────────────────────────
  if (mediaError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] bg-warm-gradient px-4">
        <Card className="flex max-w-sm flex-col items-center gap-5 p-8 text-center">
          <CameraOff className="size-14 text-[var(--muted-foreground)]" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-[var(--foreground)]">Camera access needed</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Please allow camera and microphone access in your browser settings, then try again.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  // ── Session timed out ───────────────────────────────────────────────────
  if (connectionState === 'timeout') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] bg-warm-gradient px-4">
        <Card className="flex max-w-sm flex-col items-center gap-5 p-8 text-center">
          <Clock className="size-14 text-[var(--muted-foreground)]" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-[var(--foreground)]">Sleep tight 🌙</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            The auto-reconnect window has ended. You can start a fresh room whenever you like.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reconnect
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              Back home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const roomUrl = buildRoomUrl(roomId ?? '')

  return (
    <main role="main" aria-label="Video call room" className="relative h-[100dvh] w-full overflow-hidden bg-[var(--background)]">
      <h1 className="sr-only">Active video call with {roomId}</h1>

      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        roomUrl={roomUrl}
        connectionState={connectionState}
      />

      <ConnectionStatus state={connectionState} retryCount={retryCount} timeRemainingMs={timeRemainingMs} />

      <AnimatePresence>
        {connectionState === 'reconnecting' && <ReconnectOverlay key="reconnect" retryCount={retryCount} />}
      </AnimatePresence>

      <RoomControls
        isMicOn={isAudioEnabled}
        isCameraOn={isVideoEnabled}
        onToggleMic={toggleAudio}
        onToggleCamera={toggleVideo}
        onHangUp={handleHangUp}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/room-page.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: 100dvh room page with reconnect overlay and gentle end states"
```

---

# Phase 7 — Settings & Preferences

### Task 20: SettingsPage — Appearance / Defaults / About cards

**Files:**
- Modify: `src/pages/settings-page.tsx`
- Test: `src/pages/settings-page.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `src/pages/settings-page.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from './settings-page'
import { ThemeProvider } from '@/context/theme-context'

function renderSettings() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear())

  it('renders the Settings heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument()
  })

  it('renders the theme radiogroup with three options', () => {
    renderSettings()
    const group = screen.getByRole('radiogroup', { name: 'Theme' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('selecting Dark updates the theme selection', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }))
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('renders the default-timeout slider and mirror switch', () => {
    renderSettings()
    expect(screen.getByRole('slider', { name: /default auto-reconnect/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /mirror my video/i })).toBeInTheDocument()
  })

  it('toggles the mirror switch and persists it', () => {
    renderSettings()
    const sw = screen.getByRole('switch', { name: /mirror my video/i })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(localStorage.getItem('gfvc-mirror-video')).toBe('false')
  })

  it('renders the About section with a GitHub link', () => {
    renderSettings()
    expect(screen.getByText(/version/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view source on github/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/settings-page.test.tsx`
Expected: FAIL — current page has no `radiogroup` named "Theme", no default-timeout slider, no mirror switch.

- [ ] **Step 3: Rewrite `settings-page.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { useTheme } from '@/hooks/use-theme'
import { usePreferences } from '@/hooks/use-preferences'
import { pageVariants } from '@/lib/animations'
import type { Theme } from '@/types'

const THEME_OPTIONS: SegmentedOption<Theme>[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

const MIN_MS = 300_000
const MAX_MS = 7_200_000
const STEP_MS = 300_000

function formatDuration(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hr' : `${hours} hr`
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { defaultTimeoutMs, setDefaultTimeoutMs, mirrorVideo, setMirrorVideo } = usePreferences()
  const pct = ((defaultTimeoutMs - MIN_MS) / (MAX_MS - MIN_MS)) * 100

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 bg-warm-gradient">
      <PageContainer className="max-w-xl">
        <main className="space-y-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h1>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Appearance</h2>
            <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={setTheme} ariaLabel="Theme" layoutId="theme-thumb" />
          </Card>

          <Card className="space-y-5 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Defaults</h2>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="default-timeout" className="text-sm font-medium text-[var(--foreground)]">
                  Default auto-reconnect window
                </label>
                <span className="font-display text-sm font-semibold text-[var(--primary)]" aria-live="polite">
                  {formatDuration(defaultTimeoutMs)}
                </span>
              </div>
              <input
                id="default-timeout"
                type="range"
                min={MIN_MS}
                max={MAX_MS}
                step={STEP_MS}
                value={defaultTimeoutMs}
                onChange={(e) => setDefaultTimeoutMs(Number(e.target.value))}
                aria-label="Default auto-reconnect window"
                aria-valuetext={formatDuration(defaultTimeoutMs)}
                style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--secondary) ${pct}%)` }}
                className="w-full h-2.5 appearance-none rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:shadow-warm [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">Used when you start a new room.</p>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="mirror-toggle" className="text-sm font-medium text-[var(--foreground)]">
                Mirror my video
              </label>
              <Switch id="mirror-toggle" checked={mirrorVideo} onCheckedChange={setMirrorVideo} className="ml-4" />
            </div>
          </Card>

          <Card className="space-y-1 p-6">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">About</h2>
            <p className="font-display text-base font-semibold text-[var(--foreground)]">gf&#8209;vid&#8209;chat</p>
            <p className="text-xs text-[var(--muted-foreground)]">Version 1.0.0</p>
            <p className="text-xs text-[var(--muted-foreground)]">P2P video for couples · No accounts · No servers</p>
            <a
              href="https://github.com/carlomigueldy/gf-vid-chat"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
            >
              View source on GitHub
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </Card>
        </main>
      </PageContainer>
    </motion.div>
  )
}
```

Note: the `mirror-toggle` label is associated by proximity; the test queries the switch by its accessible name. To guarantee the name, the `Switch` needs an `aria-label`. Update the call to include it:
```tsx
            <Switch id="mirror-toggle" checked={mirrorVideo} onCheckedChange={setMirrorVideo} className="ml-4" />
```
If `getByRole('switch', { name: /mirror my video/i })` fails (the `Switch` renders a `<button>` with no text), add `aria-label="Mirror my video"` to the `Switch` — extend `SwitchProps` with an optional `ariaLabel`/pass-through. Simplest: add `aria-label` support by changing the `Switch` to spread an `aria-label`. Do that in Step 3b.

- [ ] **Step 3b: Give `Switch` an accessible name**

Modify `src/components/ui/switch.tsx` to accept and forward `aria-label`:
```tsx
export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export function Switch({ checked, onCheckedChange, disabled, className, id, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--input)]',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
```
Then in `settings-page.tsx` pass it:
```tsx
            <Switch id="mirror-toggle" aria-label="Mirror my video" checked={mirrorVideo} onCheckedChange={setMirrorVideo} className="ml-4" />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/settings-page.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings-page.tsx src/components/ui/switch.tsx src/pages/settings-page.test.tsx
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "feat: structured Settings with Appearance, Defaults, and About cards"
```

---

# Phase 8 — Responsive, E2E, Docs, Verify

### Task 21: Update Playwright e2e specs to the new markup

**Files:**
- Modify: `e2e/home.spec.ts`
- Modify: `e2e/join-room.spec.ts`
- Modify: `e2e/room-controls.spec.ts`
- (`e2e/create-room.spec.ts` and `e2e/theme.spec.ts` need **no** changes — the anchors they use are preserved.)

- [ ] **Step 1: Rewrite `e2e/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero heading and tagline', async ({ page }) => {
    await expect(page).toHaveTitle(/gf.?vid.?chat/i)

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/stay close/i)

    await expect(page.getByText(/just you two/i)).toBeVisible()
    await expect(page.getByRole('link', { name: 'gf-vid-chat home' })).toBeVisible()
  })

  test('shows the Start/Join toggle and the Create Room button', async ({ page }) => {
    await expect(page.getByRole('radio', { name: /start a room/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /join a room/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create room/i })).toBeVisible()
  })

  test('header navigation links work', async ({ page }) => {
    await page.getByRole('link', { name: /^settings$/i }).click()
    await expect(page).toHaveURL(/\/settings$/)

    await page.getByRole('link', { name: /^home$/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
```

- [ ] **Step 2: Rewrite `e2e/join-room.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

async function openJoin(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('radio', { name: /join a room/i }).click()
}

test.describe('Join room flow', () => {
  test('join panel shows the three method options', async ({ page }) => {
    await openJoin(page)
    const group = page.getByRole('radiogroup', { name: 'Join method' })
    await expect(group.getByRole('radio', { name: /scan/i })).toBeVisible()
    await expect(group.getByRole('radio', { name: /upload/i })).toBeVisible()
    await expect(group.getByRole('radio', { name: /paste/i })).toBeVisible()
  })

  test('paste method has input field and disabled join button', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()

    await expect(page.getByLabel(/room link or ID/i)).toBeVisible()
    const joinButton = page.getByRole('button', { name: /^join room$/i })
    await expect(joinButton).toBeVisible()
    await expect(joinButton).toBeDisabled()
  })

  test('pasting a valid room ID navigates to the room as joiner', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()
    await page.getByLabel(/room link or ID/i).fill('test-room-1234')
    await page.getByRole('button', { name: /^join room$/i }).click()
    await expect(page).toHaveURL(/\/room\/test-room-1234\?role=joiner/)
  })

  test('pasting an invalid value shows an error', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()
    await page.getByLabel(/room link or ID/i).fill('!!')
    await page.getByRole('button', { name: /^join room$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/valid room link/i)
  })

  test('navigating directly to /room/:id?role=joiner loads room page', async ({ page }) => {
    await page.goto('/room/direct-join-abc?role=joiner')
    await expect(page.getByRole('status')).toBeVisible({ timeout: 15_000 })
  })

  test('upload method renders a file picker control', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /upload/i }).click()
    expect(await page.locator('input[type="file"]').count()).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Update the end-call assertion in `e2e/room-controls.spec.ts`**

Replace the `end call navigates back to home` test (lines 78-86):
```ts
  test('end call navigates back to home', async ({ page }) => {
    await keepControlsVisible(page)
    await page.getByRole('button', { name: /end call/i }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('radio', { name: /start a room/i })).toBeVisible()
  })
```

- [ ] **Step 4: Run the e2e suite**

Run: `pnpm test:e2e`
Expected: PASS. (If browsers aren't installed: `pnpm exec playwright install` first. If the local environment cannot grant camera permissions, the room-controls/create-room waiting assertions may be flaky — re-run; these are environmental, not code, failures.)

- [ ] **Step 5: Commit**

```bash
git add e2e/home.spec.ts e2e/join-room.spec.ts e2e/room-controls.spec.ts
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "test: update e2e specs for segmented hero and join methods"
```

---

### Task 22: Responsive audit pass

**Files:** (touch-ups only, as needed) `src/components/layout/page-container.tsx`, any surface found lacking.

- [ ] **Step 1: Run the app and inspect each surface at three widths**

Run: `pnpm dev`
Check at **375px** (phone), **768px** (tablet), **1280px** (desktop), in light and dark:
- Home: hero readable, toggle swaps in place, no horizontal scroll, card never edge-to-edge on desktop (PageContainer `max-w-md` keeps it centered).
- Settings: cards in a centered `max-w-xl` column; no stretched full-width.
- Active call: video fills viewport; control dock not clipped by mobile chrome (`100dvh` + safe-area); PiP within bounds.
- QR display / scan / upload: centered, comfortable size at all widths.

- [ ] **Step 2: Confirm `PageContainer` plays well with overrides**

Confirm `src/components/layout/page-container.tsx` uses `cn('max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full', className)` so `max-w-md` / `max-w-xl` overrides win via tailwind-merge. No change needed unless an overflow is found; if a surface overflows on a 320px screen, fix with `min-w-0` / wrapping at the offending node and note it in the commit.

- [ ] **Step 3: Confirm reduced-motion**

In devtools, enable "prefers-reduced-motion: reduce" and reload: segmented thumb, panel swaps, breathing, and the theme-toggle spin should all collapse to instant/!near-instant. (Handled by the global media query in `globals.css` + `useReducedMotion` in SegmentedControl/VideoGrid/Header.)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "fix: responsive touch-ups across surfaces" || echo "no fixes needed"
```

---

### Task 23: Update `docs/UI_SPECS.md`

**Files:**
- Modify: `docs/UI_SPECS.md`

- [ ] **Step 1: Update the typography + design-direction notes**

In the "Typography Scale" table, change the font expectations to reflect the new system, and add a short subsection under "Design Direction". Insert this block immediately after the "### Visual Principles" list:
```markdown
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
```
Update the "Mono (IDs, URLs)" row note if present to clarify body text is Plus Jakarta Sans and headings use Fredoka.

- [ ] **Step 2: Commit**

```bash
git add docs/UI_SPECS.md
git commit --author="Carlo Miguel Dy <carlomigueldy@gmail.com>" -m "docs: record elevated Soft & Rounded language in UI_SPECS"
```

---

### Task 24: Final verification loop + PR

- [ ] **Step 1: Full verification loop**

Run in order:
```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```
Expected: every command exits 0. Fix any failure before proceeding (do not skip a failing gate).

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feat/design-enhancement
```

- [ ] **Step 3: Open the PR**

```bash
gh pr create --title "feat: design enhancement & responsive redesign" --body "$(cat <<'EOF'
## Summary
Elevates the Soft + Warm UI into a playful "Soft & Rounded" language and makes every surface phone-first responsive. Presentation-layer only — P2P/reconnect logic untouched.

- Self-hosted Fredoka (display) + Plus Jakarta Sans (body)
- Reusable SegmentedControl primitive (home toggle, join methods, theme)
- Segmented-hero home; glow-pill buttons; rounded-3xl glow cards
- Glass control dock; draggable tap-to-swap PiP; calm breathing reconnect overlay
- Structured Settings (Appearance / Defaults / About) backed by usePreferences
- Floating pill header; 100dvh + safe-area on the call; fluid hero type

## Test plan
- `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e` all green
- Verified phone/tablet/desktop in light + dark; reduced-motion honored

Spec: docs/superpowers/specs/2026-05-30-design-enhancement-responsive-design.md
Plan: docs/superpowers/plans/2026-05-30-design-enhancement-responsive.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Confirm Vercel preview deploys**

After the PR opens, check the Vercel preview deployment status (`gh pr checks` or the PR page). Confirm it builds and the preview URL loads the new UI. If it fails, inspect the build log and fix before requesting review.

---

## Self-Review (completed during planning)

**Spec coverage:** Foundation/fonts → T1–T3; gradient/glow/radius → T2; usePreferences/Defaults → T4, T20; Button pills/glow → T6; SegmentedControl → T7 (used T10/T11/T20); Card → T5; Header floating + animated toggle → T8; Home segmented hero → T11 (panels T9/T10); QR/scan/upload → T12–T14; glass dock + safe-area → T15; draggable swap PiP + mirror → T16; calm reconnect → T17–T19; 100dvh + gentle end states → T19; Settings structure → T20; responsive/clamp/reduced-motion → T11/T19/T22; accessibility (labels, radiogroups, switch name, aria-hidden emoji) → throughout; e2e updates → T21; UI_SPECS → T23; verification/PR → T24. No spec requirement is unmapped.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows assertions.

**Type consistency:** `SegmentedOption<T>`/`SegmentedControl` props identical across T7/T10/T11/T20; `usePreferences` return shape consistent across T4/T9/T16/T20 (`defaultTimeoutMs`, `setDefaultTimeoutMs`, `mirrorVideo`, `setMirrorVideo`); VideoGrid swap labels (`Show your video full screen` / `Show partner video full screen`) match between T16 component and test and the T21 room-controls e2e; preserved anchors listed in Conventions match the unchanged e2e specs.
