import { useId, useRef } from 'react'
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
  layoutId?: string
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
  const autoId = useId()
  const thumbId = layoutId ?? autoId
  const selectedIndex = options.findIndex((o) => o.value === value)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  function move(delta: number) {
    if (options.length === 0) return
    const base = selectedIndex < 0 ? 0 : selectedIndex
    const nextIndex = (base + delta + options.length) % options.length
    onChange(options[nextIndex].value)
    btnRefs.current[nextIndex]?.focus()
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
      {options.map((opt, i) => {
        const selected = opt.value === value
        const Icon = opt.Icon
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!selected) onChange(opt.value)
            }}
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
                layoutId={thumbId}
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
