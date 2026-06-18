import { test, expect } from '@playwright/test'

test('home renders hero text + canvas', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Néhlil/ })).toBeVisible()
  await expect(page.locator('canvas#galaxy')).toBeAttached()
})

test('blog lists posts and article highlights code', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible()
  await page.goto('/blog/hello-world')
  // Astro's Shiki colors each token with an inline `style="color:…"`. The
  // `astro-code` class is stripped by rehype-sanitize, so assert on the
  // surviving inline token color — proves highlighting actually rendered,
  // independent of Astro's internal class names.
  await expect(page.locator('article pre span[style*="color"]').first()).toBeVisible()
})
