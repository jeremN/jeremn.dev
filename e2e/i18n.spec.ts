import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('French home page', () => {
  test('renders the French headline at /fr/', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('h1')).toContainText('Je construis des applications web')
    await expect(page.locator('h1')).toContainText('monde réel.')
  })

  test('keeps the English headline at the root', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('h1')).toContainText('I build web apps for the')
    await expect(page.locator('h1')).toContainText('real world.')
  })

  test('renders the underline doodle inside both headlines', async ({ page }) => {
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
    }
  })
})
