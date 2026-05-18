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

  function resetHideTimer() {
    setIsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setIsVisible(false), HIDE_DELAY_MS)
  }

  useEffect(() => {
    resetHideTimer()
    document.addEventListener('pointermove', resetHideTimer)
    document.addEventListener('pointerdown', resetHideTimer)
    return () => {
      document.removeEventListener('pointermove', resetHideTimer)
      document.removeEventListener('pointerdown', resetHideTimer)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={controlsSlideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <div
            role="toolbar"
            aria-label="Call controls"
            className="flex items-center gap-3 px-5 py-3 rounded-full
              bg-[var(--background)]/90 backdrop-blur-md
              border border-[var(--border)] shadow-warm-lg"
          >
            {/* Mic */}
            <Button
              variant={isMicOn ? 'ghost' : undefined}
              size="icon"
              onClick={onToggleMic}
              aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={!isMicOn}
              className={cn(
                'size-11 rounded-full',
                !isMicOn && 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500'
              )}
            >
              {isMicOn ? (
                <Mic className="size-5" aria-hidden="true" />
              ) : (
                <MicOff className="size-5" aria-hidden="true" />
              )}
            </Button>

            {/* Camera */}
            <Button
              variant={isCameraOn ? 'ghost' : undefined}
              size="icon"
              onClick={onToggleCamera}
              aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              aria-pressed={!isCameraOn}
              className={cn(
                'size-11 rounded-full',
                !isCameraOn && 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500'
              )}
            >
              {isCameraOn ? (
                <Video className="size-5" aria-hidden="true" />
              ) : (
                <VideoOff className="size-5" aria-hidden="true" />
              )}
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="size-11 rounded-full"
            >
              {isFullscreen ? (
                <Minimize className="size-5" aria-hidden="true" />
              ) : (
                <Maximize className="size-5" aria-hidden="true" />
              )}
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--border)] mx-1" aria-hidden="true" />

            {/* Hang up */}
            <button
              type="button"
              onClick={onHangUp}
              aria-label="End call"
              className="size-11 rounded-full bg-red-500 hover:bg-red-600 text-white
                transition-colors duration-150 flex items-center justify-center
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <PhoneOff className="size-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
