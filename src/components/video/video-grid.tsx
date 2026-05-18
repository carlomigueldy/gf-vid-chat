import { VideoPlayer } from './video-player'
import { QrDisplay } from '@/components/qr/qr-display'
import type { ConnectionState } from '@/types'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  roomUrl: string
  connectionState: ConnectionState
}

const WAITING_STATES: ConnectionState[] = ['initializing', 'waiting']

export function VideoGrid({
  localStream,
  remoteStream,
  roomUrl,
  connectionState,
}: VideoGridProps) {
  const isWaiting = WAITING_STATES.includes(connectionState)

  return (
    <div
      role="main"
      aria-label="Video call"
      className="relative w-full h-full"
    >
      {/* Screen-reader only state announcer */}
      <p aria-live="polite" className="sr-only">
        {isWaiting ? 'Waiting for your partner to join' : `Call status: ${connectionState}`}
      </p>

      {isWaiting ? (
        /* Waiting state — show QR centered */
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[var(--background)] px-4">
          <h1 className="sr-only">Active video call</h1>
          <QrDisplay url={roomUrl} />
          <p className="text-sm text-[var(--muted-foreground)] animate-pulse-slow">
            Waiting for your partner…
          </p>
        </div>
      ) : (
        /* Connected state — remote video fullscreen + local PiP */
        <>
          {/* Remote video — fills entire parent */}
          <VideoPlayer
            stream={remoteStream}
            label="Remote video"
            objectFit="cover"
            className="absolute inset-0 w-full h-full rounded-none"
          />

          {/* Dark scrim for badge readability */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />

          {/* Local PiP — bottom-right above controls */}
          <div className="absolute bottom-24 right-4 w-28 h-40 md:w-36 md:h-52 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 z-10">
            <VideoPlayer
              stream={localStream}
              muted
              mirror
              label="Your video"
              objectFit="cover"
              className="w-full h-full rounded-none"
            />
          </div>
        </>
      )}
    </div>
  )
}
