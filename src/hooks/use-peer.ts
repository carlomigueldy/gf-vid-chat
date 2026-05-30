import Peer from 'peerjs'
import type { MediaConnection } from 'peerjs'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  BACKOFF_MULTIPLIER,
  buildPeerConfig,
  INITIAL_BACKOFF_MS,
  MAX_BACKOFF_MS,
  PEER_ID_PREFIX,
} from '@/lib/peer-config'
import type { ConnectionState, Role } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePeerOptions {
  roomId: string
  role: Role
  localStream: MediaStream | null
  retryTimeoutMs: number
}

export interface UsePeerReturn {
  remoteStream: MediaStream | null
  connectionState: ConnectionState
  retryCount: number
  timeRemainingMs: number
  disconnect: () => void
  getPeerConnection: () => RTCPeerConnection | null
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface PeerState {
  connectionState: ConnectionState
  remoteStream: MediaStream | null
  retryCount: number
  retryStartTime: number | null
  timeRemainingMs: number
}

type PeerAction =
  | { type: 'WAITING' }
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED'; remoteStream: MediaStream }
  | { type: 'RECONNECTING'; retryStartTime: number }
  | { type: 'TIMEOUT' }
  | { type: 'FAILED' }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }
  | { type: 'CLEAR_REMOTE_STREAM' }
  | { type: 'TICK'; timeRemainingMs: number }

function peerReducer(state: PeerState, action: PeerAction): PeerState {
  switch (action.type) {
    case 'WAITING':
      return { ...state, connectionState: 'waiting' }
    case 'CONNECTING':
      return { ...state, connectionState: 'connecting' }
    case 'CONNECTED':
      return {
        ...state,
        connectionState: 'connected',
        remoteStream: action.remoteStream,
        retryCount: 0,
        retryStartTime: null,
        timeRemainingMs: 0,
      }
    case 'RECONNECTING':
      return {
        ...state,
        connectionState: 'reconnecting',
        retryStartTime: action.retryStartTime,
      }
    case 'TIMEOUT':
      return { ...state, connectionState: 'timeout', remoteStream: null }
    case 'FAILED':
      return { ...state, connectionState: 'failed', remoteStream: null }
    case 'INCREMENT_RETRY':
      return { ...state, retryCount: state.retryCount + 1 }
    case 'RESET_RETRY':
      return { ...state, retryCount: 0, retryStartTime: null }
    case 'CLEAR_REMOTE_STREAM':
      return { ...state, remoteStream: null }
    case 'TICK':
      return { ...state, timeRemainingMs: action.timeRemainingMs }
    default:
      return state
  }
}

const initialState: PeerState = {
  connectionState: 'initializing',
  remoteStream: null,
  retryCount: 0,
  retryStartTime: null,
  timeRemainingMs: 0,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePeer({
  roomId,
  role,
  localStream,
  retryTimeoutMs,
}: UsePeerOptions): UsePeerReturn {
  const [state, dispatch] = useReducer(peerReducer, initialState)

  // Mutable refs — do NOT put these in state or deps
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const currentBackoffRef = useRef<number>(INITIAL_BACKOFF_MS)
  const retryStartTimeRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const connectRef = useRef<() => void>(() => undefined)

  // Keep a stable ref to retryTimeoutMs to avoid stale-closure bugs in
  // scheduleRetry without re-creating connect
  const retryTimeoutMsRef = useRef(retryTimeoutMs)
  useEffect(() => {
    retryTimeoutMsRef.current = retryTimeoutMs
  }, [retryTimeoutMs])

  // ---------------------------------------------------------------------------
  // cleanup — destroys peer + call + remote stream, clears all timers
  // ---------------------------------------------------------------------------
  const cleanup = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()

    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }

    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop())
      remoteStreamRef.current = null
    }
  }, [])

  // ---------------------------------------------------------------------------
  // scheduleRetry
  // ---------------------------------------------------------------------------
  const scheduleRetry = useCallback(() => {
    if (!isMountedRef.current) return

    // Initialise retry start time on first retry
    if (retryStartTimeRef.current === null) {
      retryStartTimeRef.current = Date.now()
    }

    const elapsed = Date.now() - retryStartTimeRef.current
    if (elapsed >= retryTimeoutMsRef.current) {
      dispatch({ type: 'TIMEOUT' })
      cleanup()
      return
    }

    dispatch({
      type: 'RECONNECTING',
      retryStartTime: retryStartTimeRef.current,
    })
    dispatch({ type: 'INCREMENT_RETRY' })

    const delay = Math.min(currentBackoffRef.current, MAX_BACKOFF_MS)
    currentBackoffRef.current = Math.min(
      currentBackoffRef.current * BACKOFF_MULTIPLIER,
      MAX_BACKOFF_MS,
    )

    const timer = setTimeout(() => {
      timersRef.current.delete(timer)
      connectRef.current()
    }, delay)
    timersRef.current.add(timer)
  }, [cleanup])

  // ---------------------------------------------------------------------------
  // handleRemoteStream — called when a stream event fires on a MediaConnection
  // ---------------------------------------------------------------------------
  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    if (!isMountedRef.current) return
    remoteStreamRef.current = remoteStream
    // Reset backoff on success
    currentBackoffRef.current = INITIAL_BACKOFF_MS
    retryStartTimeRef.current = null
    dispatch({ type: 'CONNECTED', remoteStream })
  }, [])

  // ---------------------------------------------------------------------------
  // connect — creates a new Peer, sets up call logic
  // ---------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (!isMountedRef.current || !localStream) return

    cleanup()
    dispatch({ type: 'CONNECTING' })

    const peerId = role === 'creator' ? `${PEER_ID_PREFIX}${roomId}` : undefined
    const peerConfig = buildPeerConfig()
    const peer = peerId
      ? new Peer(peerId, peerConfig)
      : new Peer(peerConfig)
    peerRef.current = peer

    // ---- creator: listen for incoming calls ----
    if (role === 'creator') {
      dispatch({ type: 'WAITING' })

      peer.on('call', (incomingCall) => {
        if (!isMountedRef.current) return
        dispatch({ type: 'CONNECTING' })
        callRef.current = incomingCall
        incomingCall.answer(localStream)

        incomingCall.on('stream', handleRemoteStream)

        incomingCall.on('close', () => {
          if (!isMountedRef.current) return
          dispatch({ type: 'CLEAR_REMOTE_STREAM' })
          scheduleRetry()
        })

        incomingCall.on('error', () => {
          if (!isMountedRef.current) return
          dispatch({ type: 'CLEAR_REMOTE_STREAM' })
          scheduleRetry()
        })
      })
    }

    // ---- joiner: call the creator once peer is open ----
    peer.on('open', () => {
      if (!isMountedRef.current) return
      if (role === 'joiner') {
        const creatorId = `${PEER_ID_PREFIX}${roomId}`
        const outgoingCall = peer.call(creatorId, localStream)
        callRef.current = outgoingCall

        outgoingCall.on('stream', handleRemoteStream)

        outgoingCall.on('close', () => {
          if (!isMountedRef.current) return
          dispatch({ type: 'CLEAR_REMOTE_STREAM' })
          scheduleRetry()
        })

        outgoingCall.on('error', () => {
          if (!isMountedRef.current) return
          dispatch({ type: 'CLEAR_REMOTE_STREAM' })
          scheduleRetry()
        })
      }
    })

    // ---- error handling ----
    peer.on('error', (err) => {
      if (!isMountedRef.current) return

      const recoverable = [
        'peer-unavailable',
        'network',
        'server-error',
        'disconnected',
      ]

      if (err.type === 'disconnected') {
        try {
          peer.reconnect()
        } catch {
          scheduleRetry()
        }
        return
      }

      if (recoverable.includes(err.type as string)) {
        scheduleRetry()
      } else {
        dispatch({ type: 'FAILED' })
        cleanup()
      }
    })

    peer.on('disconnected', () => {
      if (!isMountedRef.current) return
      scheduleRetry()
    })
  }, [cleanup, handleRemoteStream, localStream, role, roomId, scheduleRetry])

  // Keep connectRef in sync so scheduleRetry always calls the latest connect
  useEffect(() => {
    connectRef.current = connect
  })

  // ---------------------------------------------------------------------------
  // Visibility change — resume immediately when tab becomes visible
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState === 'visible' &&
        state.connectionState === 'reconnecting'
      ) {
        // Clear pending backoff timers and reconnect immediately
        timersRef.current.forEach((t) => clearTimeout(t))
        timersRef.current.clear()
        connectRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.connectionState])

  // ---------------------------------------------------------------------------
  // Countdown ticker for timeRemainingMs
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state.connectionState !== 'reconnecting' || state.retryStartTime === null) {
      return
    }

    const startTime = state.retryStartTime

    function tick() {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, retryTimeoutMsRef.current - elapsed)
      dispatch({ type: 'TICK', timeRemainingMs: remaining })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [state.connectionState, state.retryStartTime])

  // ---------------------------------------------------------------------------
  // Main effect — start connecting when localStream is ready
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!localStream) return

    isMountedRef.current = true
    connect()

    return () => {
      isMountedRef.current = false
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream])

  // ---------------------------------------------------------------------------
  // Public disconnect — idempotent
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    isMountedRef.current = false
    cleanup()
    dispatch({ type: 'FAILED' })
  }, [cleanup])

  const getPeerConnection = useCallback((): RTCPeerConnection | null => {
    return callRef.current?.peerConnection ?? null
  }, [])

  return {
    remoteStream: state.remoteStream,
    connectionState: state.connectionState,
    retryCount: state.retryCount,
    timeRemainingMs: state.timeRemainingMs,
    disconnect,
    getPeerConnection,
  }
}
