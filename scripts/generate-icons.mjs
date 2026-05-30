import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const PUBLIC = resolve(process.cwd(), 'public')
const svg = await readFile(resolve(PUBLIC, 'favicon.svg'), 'utf8')
const glyph = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
const CREAM = '#fdfcfb'

const browser = await chromium.launch()

async function tile({ name, size, radius, glyphScale, transparent = false }) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;padding:0}
    .tile{width:${size}px;height:${size}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;
      ${transparent ? '' : `background:${CREAM};`}${radius ? `border-radius:${radius}px;` : ''}overflow:hidden}
    .tile img{width:${Math.round(size * glyphScale)}px;height:auto}
  </style></head><body><div class="tile"><img src="${glyph}"/></div></body></html>`)
  await page.waitForTimeout(150)
  const el = await page.$('.tile')
  await el.screenshot({ path: resolve(PUBLIC, name), omitBackground: transparent })
  await page.close()
  console.log('  →', name)
}

// "any"-purpose icons: cream rounded tile
await tile({ name: 'icon-192.png', size: 192, radius: 40, glyphScale: 0.56 })
await tile({ name: 'icon-512.png', size: 512, radius: 112, glyphScale: 0.56 })
// maskable: full-bleed cream, glyph within the central safe zone, NO rounding
await tile({ name: 'maskable-512.png', size: 512, radius: 0, glyphScale: 0.5 })
// apple-touch-icon: full-bleed cream (iOS rounds it), opaque
await tile({ name: 'apple-touch-icon.png', size: 180, radius: 0, glyphScale: 0.6 })

// Open Graph share card 1200x630
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await og.setContent(`<!doctype html><html><head><style>
  html,body{margin:0}
  .og{width:1200px;height:630px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
    background:radial-gradient(ellipse 90% 75% at 50% -5%, #ffd6e2, #fdfcfb 68%);
    font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#2a1a1f}
  .title{font-weight:800;font-size:88px;letter-spacing:-3px;display:flex;align-items:center;gap:20px}
  .dot{width:26px;height:26px;border-radius:99px;background:#e0457b;box-shadow:0 0 0 9px rgba(224,69,123,.18)}
  .sub{font-size:30px;font-weight:500;color:#7a5560;max-width:820px;text-align:center;line-height:1.4}
</style></head><body><div class="og">
  <div class="title"><span class="dot"></span>gf-vid-chat 💗</div>
  <div class="sub">Peer-to-peer video for couples — QR rooms, silent auto-reconnect, no accounts, no backend.</div>
</div></body></html>`)
await og.waitForTimeout(300)
await og.screenshot({ path: resolve(PUBLIC, 'og-image.png') })
await og.close()
console.log('  → og-image.png')

await browser.close()
console.log('done')
