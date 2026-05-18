import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseMediaStreamReturn {
  stream: MediaStream | null
  error: string | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  toggleAudio: () => void
  toggleVideo: () => void
}

export function useMediaStream(): UseMediaStreamReturn {
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function initStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = mediaStream
        setStream(mediaStream)
        setError(null)
      } catch (err) {
        if (cancelled) return

        if (err instanceof DOMException || err instanceof Error) {
          const name = (err as DOMException).name ?? ''
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            setError(
              'Camera access denied. Please allow camera access in your browser settings.',
            )
          } else if (
            name === 'NotFoundError' ||
            name === 'DevicesNotFoundError'
          ) {
            setError('No camera found. Please connect a camera.')
          } else {
            setError(`Failed to access camera: ${err.message}`)
          }
        } else {
          setError('Failed to access camera: unknown error')
        }
      }
    }

    void initStream()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return
    const audioTracks = streamRef.current.getAudioTracks()
    const next = !isAudioEnabled
    audioTracks.forEach((t) => {
      t.enabled = next
    })
    setIsAudioEnabled(next)
  }, [isAudioEnabled])

  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return
    const videoTracks = streamRef.current.getVideoTracks()
    const next = !isVideoEnabled
    videoTracks.forEach((t) => {
      t.enabled = next
    })
    setIsVideoEnabled(next)
  }, [isVideoEnabled])

  return { stream, error, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo }
}
