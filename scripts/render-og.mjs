// Renders every social card to public/og/<slug>.jpg via a throwaway Astro dev
// server + Playwright. Run with: npm run og
//
// The output is a committed artifact, like public/cv.pdf. Re-run it after
// publishing an article, after translating one, and after changing the card
// design. Nothing regenerates it automatically: a page build has no browser.
//
// Runs against `astro build && astro preview`, not `astro dev`. Two reasons:
// the card then screenshots the production CSS rather than the dev pipeline's,
// and the dev toolbar does not exist to appear in the frame. It did, as a dark
// sliver along the bottom edge of every card, on the first run of this script.
//
// Uses port 4334, clear of the CV script's 4333 and of the 4321 Playwright's
// preview server takes during e2e.
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { readArticles } from './articles.mjs'

const PORT = 4334
const ORIGIN = `http://localhost:${PORT}`
const OUT_DIR = 'public/og'
const BLOG_DIR = fileURLToPath(new URL('../src/content/blog', import.meta.url))

// The two site-wide cards, then one per published article. Same list the route
// builds from, derived the same way, so a card is never silently missing.
const SLUGS = [
  'site',
  'site-fr',
  ...readArticles(BLOG_DIR)
    .filter((a) => !a.draft)
    .map((a) => a.slug),
]

async function waitForServer(url, timeoutMs = 180_000) {
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
  throw new Error(`Preview server did not answer at ${url} within ${timeoutMs}ms`)
}

// detached, so the whole process group can be killed (astro spawns children)
const server = spawn('sh', ['-c', `npm run build && npm run preview -- --port ${PORT}`], {
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
  await waitForServer(`${ORIGIN}/og/site`)

  // Cleared rather than overwritten: a renamed or unpublished article would
  // otherwise leave its card behind, and the stale file keeps resolving.
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })

  for (const slug of SLUGS) {
    const url = `${ORIGIN}/og/${slug}`
    const response = await page.goto(url, { waitUntil: 'networkidle' })
    if (!response?.ok()) throw new Error(`${url} answered ${response?.status()}`)
    // The fonts are self-hosted and load late. Without this the card
    // screenshots in the fallback face, which is a silent design regression.
    await page.evaluate(() => document.fonts.ready)
    const card = page.locator('[data-og-card]')
    await card.waitFor({ state: 'visible' })
    await card.screenshot({ path: `${OUT_DIR}/${slug}.jpg`, type: 'jpeg', quality: 90 })
  }

  await browser.close()
  console.log(`Wrote ${readdirSync(OUT_DIR).length} cards to ${OUT_DIR}/`)
} finally {
  stop()
}
