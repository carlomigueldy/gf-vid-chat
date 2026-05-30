import type { ConnectionQualityInfo } from '@/types'

const LEVELS = {
  good: { level: 3, color: 'bg-green-500', label: 'Good' },
  fair: { level: 2, color: 'bg-yellow-500', label: 'Fair' },
  poor: { level: 1, color: 'bg-red-500', label: 'Poor' },
} as const

export function ConnectionQuality({ info }: { info: ConnectionQualityInfo }) {
  if (info.quality === 'unknown') return null
  const { level, color, label } = LEVELS[info.quality]

  return (
    <div
      role="status"
      aria-label={`Connection quality: ${label}${info.isRelayed ? ', relayed' : ''}`}
      className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[var(--card)]/70 px-3 py-1.5 backdrop-blur-md"
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-sm ${bar <= level ? color : 'bg-white/25'}`}
            style={{ height: `${bar * 4 + 2}px` }}
          />
        ))}
      </span>
      {info.isRelayed && (
        <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
          Relay
        </span>
      )}
    </div>
  )
}
