export type ConnectionState =
  | 'initializing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed'
  | 'timeout'

export type Role = 'creator' | 'joiner'

export interface RoomConfig {
  roomId: string
  role: Role
  retryTimeoutMs: number
}

export type Theme = 'light' | 'dark' | 'system'

export interface TurnConfig {
  urls: string
  username?: string
  credential?: string
}
