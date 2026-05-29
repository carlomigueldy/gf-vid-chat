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
  const didDragRef = useRef(false)
  const reduce = useReducedMotion()

  const mainStream = isLocalMain ? localStream : remoteStream
  const pipStream = isLocalMain ? remoteStream : localStream
  const pipIsLocal = !isLocalMain

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {isWaiting && (
        <p aria-live="polite" className="sr-only">
          Partner has not joined yet
        </p>
      )}

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
            onDragStart={() => {
              didDragRef.current = false
            }}
            onDrag={() => {
              didDragRef.current = true
            }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            onClick={() => {
              if (!didDragRef.current) setIsLocalMain((v) => !v)
            }}
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
