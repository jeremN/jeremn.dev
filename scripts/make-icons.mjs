// Regenerates every raster icon from public/favicon.svg, which is the only source of truth.
// Chromium is the rasterizer because Playwright is already a dev dependency here.
//
//   node scripts/make-icons.mjs
//
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
const svg = readFileSync(resolve(publicDir, 'favicon.svg'), 'utf8')
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

async function render(size) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}
     img{display:block;width:${size}px;height:${size}px}</style>
     <img src="${dataUri}">`,
  )
  await page.waitForLoadState('networkidle')
  return page.screenshot({ omitBackground: true })
}

for (const [size, name] of [
  [180, 'apple-touch-icon.png'],
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
]) {
  writeFileSync(resolve(publicDir, name), await render(size))
  console.log(`public/${name}  ${size}x${size}`)
}

// An .ico is a container: a 6-byte header, one 16-byte directory entry per image,
// then the payloads. Modern browsers accept PNG payloads, so we embed PNGs directly.
const icoSizes = [16, 32, 48]
const pngs = []
for (const size of icoSizes) pngs.push(await render(size))

const header = Buffer.alloc(6)
header.writeUInt16LE(1, 2) // type 1 = icon
header.writeUInt16LE(icoSizes.length, 4)

const dir = Buffer.alloc(16 * icoSizes.length)
let offset = header.length + dir.length
icoSizes.forEach((size, i) => {
  const at = i * 16
  dir.writeUInt8(size, at) // width
  dir.writeUInt8(size, at + 1) // height
  dir.writeUInt16LE(1, at + 4) // colour planes
  dir.writeUInt16LE(32, at + 6) // bits per pixel
  dir.writeUInt32LE(pngs[i].length, at + 8)
  dir.writeUInt32LE(offset, at + 12)
  offset += pngs[i].length
})

writeFileSync(resolve(publicDir, 'favicon.ico'), Buffer.concat([header, dir, ...pngs]))
console.log(`public/favicon.ico  ${icoSizes.join('/')}`)

await browser.close()
