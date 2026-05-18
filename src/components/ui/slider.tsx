import { cn } from '@/lib/utils'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled,
}: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'w-full h-2 rounded-full appearance-none cursor-pointer',
        'bg-[var(--secondary)] accent-[var(--primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  )
}
