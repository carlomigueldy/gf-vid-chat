import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { videoFadeIn } from '@/lib/animations'

interface VideoPlayerProps {
  stream: MediaStream | null
  muted?: boolean
  mirror?: boolean
  className?: string
  label?: string
  objectFit?: 'cover' | 'contain'
}

export function VideoPlayer({
  stream,
  muted = false,
  mirror = false,
  className,
  label,
  objectFit = 'cover',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div
      aria-label={label}
      className={cn('relative rounded-2xl overflow-hidden bg-[var(--muted)]', className)}
    >
      <AnimatePresence>
        {stream ? (
          <motion.video
            key="stream"
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            variants={videoFadeIn}
            initial="initial"
            animate="animate"
            className={cn(
              'w-full h-full',
              objectFit === 'cover' ? 'object-cover' : 'object-contain'
            )}
            style={mirror ? { transform: 'scaleX(-1)' } : undefined}
            aria-label={label}
          />
        ) : (
          <motion.div
            key="placeholder"
            variants={videoFadeIn}
            initial="initial"
            animate="animate"
            className="w-full h-full flex items-center justify-center min-h-[120px]"
          >
            <VideoOff className="size-8 text-[var(--muted-foreground)]" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
