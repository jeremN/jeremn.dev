import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const ORIGIN = 'http://localhost:4321'

test('home renders hero text + canvas', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('heading', { name: /Néhlil/ })).toBeVisible()
  await expect(page.locator('canvas#galaxy')).toBeAttached()
})

// TODO — restore the markdown-pipeline guard when the first real post ships.
// The two seed posts were tests and have been deleted, so there is currently no
// rendered article to assert against. The dropped assertion was:
//
//   await page.goto(`${BASE}/blog/<slug>`)
//   await expect(page.locator('article pre span[style*="color"]').first()).toBeVisible()
//
// It proved Shiki's highlighting survives our custom `rehype-sanitize` schema —
// sanitize runs AFTER Shiki and the default schema silently flattens code blocks
// to plain text. That regression is real (we hit it once) and is now unguarded,
// which matters because it would first bite on the very post that reintroduces it.
test('blog shows the empty state while there are no posts', async ({ page }) => {
  await page.goto(`${BASE}/blog`)
  await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible()
  await expect(page.getByText(/nothing published yet/i)).toBeVisible()
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
