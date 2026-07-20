// Renders /cv-print to public/cv.pdf via a throwaway Astro dev server + Playwright.
// Run with: npm run cv:pdf
// Uses port 4333 to avoid colliding with the default 4321 that Playwright's
// preview server uses during e2e.
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const PORT = 4333
const URL = `http://localhost:${PORT}/cv-print`
const OUT = 'public/cv.pdf'

async function waitForServer(url, timeoutMs = 40_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Dev server did not answer at ${url} within ${timeoutMs}ms`)
}

// detached so we can kill the whole process group (astro spawns children)
const server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
  stdio: 'ignore',
  detached: true,
})

const stop = () => {
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    // already gone
  }
}

try {
  await waitForServer(URL)
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true })
  await browser.close()
  console.log(`Wrote ${OUT}`)
} finally {
  stop()
}
