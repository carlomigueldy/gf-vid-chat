interface RangeSliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  minLabel?: string
  maxLabel?: string
}

export function RangeSlider({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  minLabel,
  maxLabel,
}: RangeSliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  const display = formatValue(value)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        <span className="font-display text-sm font-semibold text-[var(--primary)]" aria-live="polite" aria-atomic="true">
          {display}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--secondary) ${pct}%)` }}
        className="w-full h-2.5 appearance-none rounded-full cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--primary)] [&::-webkit-slider-thumb]:shadow-warm [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--primary)] [&::-moz-range-thumb]:cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      />

      {(minLabel || maxLabel) && (
        <div className="mt-1.5 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
