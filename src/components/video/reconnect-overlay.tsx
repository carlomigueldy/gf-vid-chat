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
