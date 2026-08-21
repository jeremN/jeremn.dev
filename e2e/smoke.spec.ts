import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const ORIGIN = 'http://localhost:4321'

test('home renders the v2 hero', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('heading', { name: /I build web apps for the real world/ })).toBeVisible()
  // The galaxy left the homepage in step 5, and the Living Canvas (the
  // earlier hero drawing surface) was retired in step 1. Assert no canvas at
  // all, so a stray re-import cannot put either one back unnoticed.
  await expect(page.locator('canvas')).toHaveCount(0)
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
  await expect(page.getByRole('heading', { name: /Notes from the workbench/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ten months of Svelte 5/ })).toBeVisible()
})

// Guards the base prefix: with base misconfigured, links drop to '/cv' and the
// active-state check (which compares a base-stripped route) stops matching.
// Asserted via attributes rather than a click, which is how this was written
// while the home page still ran a WebGL loop. It stays attribute-based: the
// check is about the href the base produces, not about navigation.
test('nav links carry the configured base and mark the active page', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await expect(page.getByRole('link', { name: 'CV' })).toHaveAttribute('href', `${BASE}/cv`)

  await page.goto(`${BASE}/cv`)
  await expect(page).toHaveURL(`${ORIGIN}${BASE}/cv`)
  await expect(page.getByRole('link', { name: 'CV' })).toHaveAttribute('aria-current', 'page')
})
