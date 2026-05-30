import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

describe('PWA assets', () => {
  it('manifest is valid JSON with the required fields', () => {
    const m = JSON.parse(read('public/manifest.webmanifest'))
    expect(m.name).toBe('gf-vid-chat')
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBe('/')
    expect(Array.isArray(m.icons)).toBe(true)
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
    expect(m.theme_color).toMatch(/^#/)
    expect(m.background_color).toMatch(/^#/)
  })

  it('index.html wires manifest, theme-color, viewport-fit, apple-touch-icon, and OG image', () => {
    const html = read('index.html')
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('name="theme-color"')
    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('property="og:image"')
  })

  it('keeps the gf-vid-chat title (e2e depends on it)', () => {
    expect(read('index.html')).toMatch(/<title>[^<]*gf-vid-chat/i)
  })
})
