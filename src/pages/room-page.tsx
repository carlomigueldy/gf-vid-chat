import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { CameraOff, Clock } from 'lucide-react'
import { useMediaStream } from '@/hooks/use-media-stream'
import { usePeer } from '@/hooks/use-peer'
import { VideoGrid } from '@/components/video/video-grid'
import { ConnectionStatus } from '@/components/video/connection-status'
import { RoomControls } from '@/components/room/room-controls'
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

  const {
    remoteStream,
    connectionState,
    retryCount,
    timeRemainingMs,
    disconnect,
  } = usePeer({
    roomId: roomId ?? '',
    role,
    localStream,
    retryTimeoutMs,
  })

  // Fullscreen management
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

  // Navigate home on hang up
  function handleHangUp() {
    disconnect()
    navigate('/')
  }

  // ── Error: camera denied ─────────────────────────────────────────────────
  if (mediaError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[var(--background)] px-4 text-center">
        <CameraOff className="size-16 text-[var(--muted-foreground)]" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Camera access required
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          Please allow camera and microphone access in your browser settings.
        </p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  // ── Error: session timed out ─────────────────────────────────────────────
  if (connectionState === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[var(--background)] px-4 text-center">
        <Clock className="size-16 text-[var(--muted-foreground)]" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Session ended
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          The auto-reconnect window has expired.
        </p>
        <Button onClick={() => navigate('/')}>Start new room</Button>
      </div>
    )
  }

  const roomUrl = buildRoomUrl(roomId ?? '')

  return (
    <main
      role="main"
      aria-label="Video call room"
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* Hidden h1 for screen readers */}
      <h1 className="sr-only">Active video call with {roomId}</h1>

      {/* Full-screen video layout */}
      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        roomUrl={roomUrl}
        connectionState={connectionState}
      />

      {/* Floating connection badge */}
      <ConnectionStatus
        state={connectionState}
        retryCount={retryCount}
        timeRemainingMs={timeRemainingMs}
      />

      {/* Floating call controls */}
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
