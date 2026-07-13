import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const ORIGIN = 'http://localhost:4321'

test('home renders hero text + canvas', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('heading', { name: /Néhlil/ })).toBeVisible()
  await expect(page.locator('canvas#galaxy')).toBeAttached()
})

test('blog lists posts and article highlights code', async ({ page }) => {
  await page.goto(`${BASE}/blog`)
  await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible()
  await page.goto(`${BASE}/blog/hello-world`)
  // Astro's Shiki colors each token with an inline `style="color:…"`. The
  // `astro-code` class is stripped by rehype-sanitize, so assert on the
  // surviving inline token color — proves highlighting actually rendered,
  // independent of Astro's internal class names.
  await expect(page.locator('article pre span[style*="color"]').first()).toBeVisible()
})

// Guards the base prefix: with base misconfigured, links drop to '/cv' and the
// active-state check (which compares a base-stripped route) stops matching.
// Asserted via attributes rather than a click — the home page runs a continuous
// WebGL loop, so Playwright's "stable bounding box" precondition never settles.
test('nav links carry the configured base and mark the active page', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('link', { name: 'CV' })).toHaveAttribute('href', `${BASE}/cv`)

  await page.goto(`${BASE}/cv`)
  await expect(page).toHaveURL(`${ORIGIN}${BASE}/cv`)
  await expect(page.getByRole('link', { name: 'CV' })).toHaveAttribute('aria-current', 'page')
})
