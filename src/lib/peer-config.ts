import type { PeerOptions } from 'peerjs'
import type { TurnConfig } from '@/types'

export const INITIAL_BACKOFF_MS = 1000
export const MAX_BACKOFF_MS = 30000
export const BACKOFF_MULTIPLIER = 2
export const DEFAULT_RETRY_TIMEOUT_MS = 3_600_000
export const PEER_ID_PREFIX = 'gfvc-'

/** localStorage key for a user-configured TURN relay (single source of truth). */
export const TURN_STORAGE_KEY = 'gfvc-turn'

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
]

/** STUN-only config, kept for back-compat/reference. Runtime uses buildPeerConfig(). */
export const DEFAULT_PEER_CONFIG: PeerOptions = {
  config: { iceServers: STUN_SERVERS },
}

interface TurnEnv {
  VITE_TURN_URLS?: string
  VITE_TURN_USERNAME?: string
  VITE_TURN_CREDENTIAL?: string
}

/** Build TURN ICE servers from Vite env vars. Pure. Returns [] when unset. */
export function parseEnvTurnServers(env: TurnEnv): RTCIceServer[] {
  const urls = (env.VITE_TURN_URLS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
  if (urls.length === 0) return []
  const server: RTCIceServer = { urls }
  if (env.VITE_TURN_USERNAME) server.username = env.VITE_TURN_USERNAME
  if (env.VITE_TURN_CREDENTIAL) server.credential = env.VITE_TURN_CREDENTIAL
  return [server]
}

function iceKey(server: RTCIceServer): string {
  const urls = Array.isArray(server.urls) ? server.urls.join(',') : server.urls
  return `${urls}|${server.username ?? ''}`
}

/** STUN (always) + env TURN + custom TURN, de-duplicated by (urls, username). Pure. */
export function buildIceServers(
  envServers: RTCIceServer[],
  customTurn: TurnConfig | null
): RTCIceServer[] {
  const servers: RTCIceServer[] = [...STUN_SERVERS, ...envServers]
  if (customTurn && customTurn.urls.trim()) {
    const custom: RTCIceServer = { urls: customTurn.urls.trim() }
    if (customTurn.username) custom.username = customTurn.username
    if (customTurn.credential) custom.credential = customTurn.credential
    servers.push(custom)
  }
  const seen = new Set<string>()
  return servers.filter((s) => {
    const key = iceKey(s)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function readCustomTurn(): TurnConfig | null {
  try {
    const raw = localStorage.getItem(TURN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TurnConfig
    return parsed && typeof parsed.urls === 'string' ? parsed : null
  } catch {
    return null
  }
}

/** Assemble the live PeerJS config from env + localStorage. Call at peer creation. */
export function buildPeerConfig(): PeerOptions {
  const envServers = parseEnvTurnServers(import.meta.env as unknown as TurnEnv)
  return { config: { iceServers: buildIceServers(envServers, readCustomTurn()) } }
}

export function buildPeerId(roomId: string): string {
  return `${PEER_ID_PREFIX}${roomId}`
}

export function calculateBackoff(attempt: number): number {
  const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt)
  return Math.min(backoff, MAX_BACKOFF_MS)
}
