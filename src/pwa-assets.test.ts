import { describe, it, expect } from 'vitest'
import manifestRaw from '../public/manifest.webmanifest?raw'
import indexHtml from '../index.html?raw'

describe('PWA assets', () => {
  it('manifest is valid JSON with the required fields', () => {
    const m = JSON.parse(manifestRaw)
    expect(m.name).toBe('gf-vid-chat')
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBe('/')
    expect(Array.isArray(m.icons)).toBe(true)
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
    expect(m.theme_color).toMatch(/^#/)
    expect(m.background_color).toMatch(/^#/)
  })

  it('index.html wires manifest, theme-color, viewport-fit, apple-touch-icon, and OG image', () => {
    expect(indexHtml).toContain('rel="manifest"')
    expect(indexHtml).toContain('name="theme-color"')
    expect(indexHtml).toContain('viewport-fit=cover')
    expect(indexHtml).toContain('rel="apple-touch-icon"')
    expect(indexHtml).toContain('property="og:image"')
  })

  it('keeps the gf-vid-chat title (e2e depends on it)', () => {
    expect(indexHtml).toMatch(/<title>[^<]*gf-vid-chat/i)
  })
})
