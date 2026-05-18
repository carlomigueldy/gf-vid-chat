import type { PeerOptions } from 'peerjs'

export const INITIAL_BACKOFF_MS = 1000
export const MAX_BACKOFF_MS = 30000
export const BACKOFF_MULTIPLIER = 2
export const DEFAULT_RETRY_TIMEOUT_MS = 3_600_000
export const PEER_ID_PREFIX = 'gfvc-'

export const DEFAULT_PEER_CONFIG: PeerOptions = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  },
}

export function buildPeerId(roomId: string): string {
  return `${PEER_ID_PREFIX}${roomId}`
}

export function calculateBackoff(attempt: number): number {
  const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt)
  return Math.min(backoff, MAX_BACKOFF_MS)
}
