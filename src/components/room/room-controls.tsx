import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize,
  Minimize,
  PhoneOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { controlsSlideUp } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface RoomControlsProps {
  isMicOn: boolean
  isCameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onHangUp: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}

const HIDE_DELAY_MS = 4000

export function RoomControls({
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  onHangUp,
  onToggleFullscreen,
  isFullscreen,
}: RoomControlsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function resetHideTimer() {
      setIsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setIsVisible(false), HIDE_DELAY_MS)
    }

    document.addEventListener('pointermove', resetHideTimer)
    document.addEventListener('pointerdown', resetHideTimer)
    hideTimerRef.current = setTimeout(() => setIsVisible(false), HIDE_DELAY_MS)

    return () => {
      document.removeEventListener('pointermove', resetHideTimer)
      document.removeEventListener('pointerdown', resetHideTimer)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

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
}
