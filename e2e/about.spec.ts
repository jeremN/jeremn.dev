import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('about page', () => {
  test('leads with the editorial title and its underline', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('h1')).toContainText('I like software that makes sense')
    await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
  })

  test('lists the four principles, numbered by a counter', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const items = page.locator('[data-principle]')
    await expect(items).toHaveCount(4)
    // The ordinal is generated, never authored, so it cannot drift from the order.
    const first = await items.first().evaluate((el) => getComputedStyle(el, '::before').content)
    expect(first).toContain('counter')
  })

  test('the tools list comes from the CV, so the two cannot contradict', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const tools = page.locator('[data-tools]')
    await expect(tools).toContainText('SvelteKit')
    await expect(tools).toContainText('Playwright')
  })

  test('the plant illustration is decorative', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('[data-doodle="plant"]')).toHaveAttribute('aria-hidden', 'true')
  })
})
