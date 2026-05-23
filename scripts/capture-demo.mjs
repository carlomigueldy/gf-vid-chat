import { chromium } from '@playwright/test'
import { mkdir, rm, readdir, rename } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const ROOT = resolve(process.cwd())
const SHOTS = resolve(ROOT, 'docs/screenshots')
const VIDEOS = resolve(ROOT, 'docs/recordings')

const VIEWPORT = { width: 1280, height: 800 }
const FAKE_MEDIA_ARGS = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
]

await rm(SHOTS, { recursive: true, force: true })
await rm(VIDEOS, { recursive: true, force: true })
await mkdir(SHOTS, { recursive: true })
await mkdir(VIDEOS, { recursive: true })

const browser = await chromium.launch({ args: FAKE_MEDIA_ARGS })

async function makeContext({ theme = 'light', record = false } = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: theme,
    permissions: ['camera', 'microphone'],
    recordVideo: record ? { dir: VIDEOS, size: VIEWPORT } : undefined,
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem('gfvc-theme', t)
      window.localStorage.setItem('theme', t)
    } catch {}
  }, theme)
  return context
}

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })
  console.log(`  → ${name}.png`)
}

// 1. Home (light + dark)
for (const theme of ['light', 'dark']) {
  console.log(`Home (${theme})`)
  const ctx = await makeContext({ theme })
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  await shot(page, `01-home-${theme}`)
  await ctx.close()
}

// 2. Create-room QR display
console.log('Create room → QR')
const creatorCtx = await makeContext({ theme: 'light', record: true })
const creator = await creatorCtx.newPage()
await creator.goto(BASE)
await creator.waitForLoadState('networkidle')
await creator.waitForTimeout(400)
await creator.getByRole('button', { name: /create room/i }).click()
await creator.waitForURL(/\/room\//)
await creator.waitForTimeout(2500) // QR animates in
await shot(creator, '02-qr-display')
const roomUrl = creator.url()
// Creator URL is /room/<id>?role=creator&timeout=...
// Build matching joiner URL on the same room id.
const joinerUrl = roomUrl.replace(/\?.*$/, '?role=joiner')
console.log(`  creator URL: ${roomUrl}`)
console.log(`  joiner  URL: ${joinerUrl}`)

// 3. Join page tabs (separate context, light)
console.log('Join page')
const joinerCtx = await makeContext({ theme: 'light' })
const joiner = await joinerCtx.newPage()
await joiner.goto(BASE)
await joiner.waitForLoadState('networkidle')
await joiner.getByRole('tab', { name: /paste/i }).click()
await joiner.waitForTimeout(500)
await shot(joiner, '03-join-paste')
await joinerCtx.close()

// 4. Active call — joiner connects to creator
console.log('Active call (2-context P2P)')
const peerCtx = await makeContext({ theme: 'light', record: true })
const peer = await peerCtx.newPage()
await peer.goto(joinerUrl)
// wait for both sides to see a video element streaming
await Promise.all([
  creator.waitForSelector('video', { state: 'visible', timeout: 30_000 }),
  peer.waitForSelector('video', { state: 'visible', timeout: 30_000 }),
])
await creator.waitForTimeout(4000) // let the connection settle, badge auto-hide
await peer.waitForTimeout(500)
await shot(creator, '04-active-call-creator')
await shot(peer, '04b-active-call-joiner')

// 5. Settings page (light + dark)
for (const theme of ['light', 'dark']) {
  console.log(`Settings (${theme})`)
  const ctx = await makeContext({ theme })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/settings`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await shot(page, `05-settings-${theme}`)
  await ctx.close()
}

// close recorded contexts last so the videos flush
await peerCtx.close()
await creatorCtx.close()
await browser.close()

// surface recorded videos
const recordings = await readdir(VIDEOS)
console.log('Recordings:', recordings)
// rename the first webm to demo-creator.webm for ffmpeg step
const webms = recordings.filter((f) => f.endsWith('.webm'))
if (webms.length >= 1) {
  await rename(`${VIDEOS}/${webms[0]}`, `${VIDEOS}/demo-creator.webm`)
  if (webms.length >= 2) {
    await rename(`${VIDEOS}/${webms[1]}`, `${VIDEOS}/demo-joiner.webm`)
  }
}

console.log('done')
