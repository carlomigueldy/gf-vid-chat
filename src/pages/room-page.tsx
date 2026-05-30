import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { CameraOff, Clock } from 'lucide-react'
import { useMediaStream } from '@/hooks/use-media-stream'
import { usePeer } from '@/hooks/use-peer'
import { usePreferences } from '@/hooks/use-preferences'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { VideoGrid } from '@/components/video/video-grid'
import { ConnectionStatus } from '@/components/video/connection-status'
import { ReconnectOverlay } from '@/components/video/reconnect-overlay'
import { RoomControls } from '@/components/room/room-controls'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types'

const DEFAULT_TIMEOUT_MS = 3_600_000 // 1 hr

function parseRole(value: string | null): Role {
  return value === 'joiner' ? 'joiner' : 'creator'
}

function buildRoomUrl(roomId: string): string {
  const base = window.location.origin
  return `${base}/room/${roomId}?role=joiner`
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const role = parseRole(searchParams.get('role'))
  const retryTimeoutMs = Number(searchParams.get('timeout')) || DEFAULT_TIMEOUT_MS

  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    stream: localStream,
    error: mediaError,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
  } = useMediaStream()

  const { remoteStream, connectionState, retryCount, timeRemainingMs, disconnect } = usePeer({
    roomId: roomId ?? '',
    role,
    localStream,
    retryTimeoutMs,
  })

  const { keepScreenAwake } = usePreferences()
  useWakeLock(keepScreenAwake && !mediaError && connectionState !== 'timeout')

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // fullscreen not supported — silently ignore
    }
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function handleHangUp() {
    disconnect()
    navigate('/')
  }

  // ── Error: camera denied ────────────────────────────────────────────────
  if (mediaError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] bg-warm-gradient px-4">
        <Card className="flex max-w-sm flex-col items-center gap-5 p-8 text-center">
          <CameraOff className="size-14 text-[var(--muted-foreground)]" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-[var(--foreground)]">Camera access needed</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Please allow camera and microphone access in your browser settings, then try again.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  // ── Session timed out ───────────────────────────────────────────────────
  if (connectionState === 'timeout') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] bg-warm-gradient px-4">
        <Card className="flex max-w-sm flex-col items-center gap-5 p-8 text-center">
          <Clock className="size-14 text-[var(--muted-foreground)]" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-[var(--foreground)]">Sleep tight 🌙</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            The auto-reconnect window has ended. You can start a fresh room whenever you like.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reconnect
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              Back home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const roomUrl = buildRoomUrl(roomId ?? '')

  return (
    <main role="main" aria-label="Video call room" className="relative h-[100dvh] w-full overflow-hidden bg-[var(--background)]">
      <h1 className="sr-only">Active video call with {roomId}</h1>

      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        roomUrl={roomUrl}
        connectionState={connectionState}
      />

      <ConnectionStatus state={connectionState} retryCount={retryCount} timeRemainingMs={timeRemainingMs} />

      <AnimatePresence>
        {connectionState === 'reconnecting' && <ReconnectOverlay key="reconnect" retryCount={retryCount} />}
      </AnimatePresence>

      <RoomControls
        isMicOn={isAudioEnabled}
        isCameraOn={isVideoEnabled}
        onToggleMic={toggleAudio}
        onToggleCamera={toggleVideo}
        onHangUp={handleHangUp}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </main>
  )
}
