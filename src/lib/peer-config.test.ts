import { describe, it, expect } from 'vitest'
import { parseEnvTurnServers, buildIceServers } from './peer-config'

describe('parseEnvTurnServers', () => {
  it('returns [] when no TURN urls are set', () => {
    expect(parseEnvTurnServers({})).toEqual([])
    expect(parseEnvTurnServers({ VITE_TURN_URLS: '' })).toEqual([])
    expect(parseEnvTurnServers({ VITE_TURN_URLS: '   ' })).toEqual([])
  })

  it('parses a comma-separated url list with credentials', () => {
    expect(
      parseEnvTurnServers({
        VITE_TURN_URLS: 'turn:a.example:3478, turns:a.example:5349',
        VITE_TURN_USERNAME: 'user',
        VITE_TURN_CREDENTIAL: 'pass',
      })
    ).toEqual([
      { urls: ['turn:a.example:3478', 'turns:a.example:5349'], username: 'user', credential: 'pass' },
    ])
  })

  it('omits credentials when not provided', () => {
    expect(parseEnvTurnServers({ VITE_TURN_URLS: 'turn:a:3478' })).toEqual([{ urls: ['turn:a:3478'] }])
  })
})

describe('buildIceServers', () => {
  it('always includes the five STUN servers', () => {
    const out = buildIceServers([], null)
    expect(out).toHaveLength(5)
    expect(out.every((s) => String(s.urls).startsWith('stun:'))).toBe(true)
  })

  it('appends env TURN servers', () => {
    const out = buildIceServers([{ urls: ['turn:a:3478'], username: 'u', credential: 'p' }], null)
    expect(out).toHaveLength(6)
    expect(out).toContainEqual({ urls: ['turn:a:3478'], username: 'u', credential: 'p' })
  })

  it('appends a custom TURN server', () => {
    const out = buildIceServers([], { urls: 'turn:b:3478', username: 'x', credential: 'y' })
    expect(out).toContainEqual({ urls: 'turn:b:3478', username: 'x', credential: 'y' })
  })

  it('ignores a custom TURN with blank urls', () => {
    expect(buildIceServers([], { urls: '   ' })).toHaveLength(5)
  })

  it('de-duplicates identical env and custom TURN', () => {
    const out = buildIceServers([{ urls: ['turn:c:3478'], username: 'u' }], { urls: 'turn:c:3478', username: 'u' })
    expect(out.filter((s) => String(s.urls).includes('turn:c'))).toHaveLength(1)
  })
})
