import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const ORIGIN = 'http://localhost:4321'

test('home renders hero text + canvas', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('heading', { name: /Néhlil/ })).toBeVisible()
  await expect(page.locator('canvas#galaxy')).toBeAttached()
})

// Guards the markdown pipeline: `rehype-sanitize` runs AFTER Shiki, and the default
// schema silently flattens code blocks to plain text by stripping Shiki's inline token
// colors. We hit that once. The custom schema in astro.config.mjs re-permits exactly
// those attributes; this asserts it still works, on a post that is mostly code blocks.
test('blog post keeps Shiki highlighting through rehype-sanitize', async ({ page }) => {
  await page.goto(`${BASE}/blog/ten-months-of-svelte-5`)
  await expect(page.locator('article pre span[style*="color"]').first()).toBeVisible()
})

test('blog lists the published post', async ({ page }) => {
  await page.goto(`${BASE}/blog`)
  await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ten months of Svelte 5/ })).toBeVisible()
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
