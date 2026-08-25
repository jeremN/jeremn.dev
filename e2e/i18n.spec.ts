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

test.describe('head and chrome per locale', () => {
  test('stamps the route locale on <html lang>', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('each variant carries the full reciprocal hreflang set', async ({ page }) => {
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/$/)
      await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/$/)
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', /\/$/)
    }
  })

  test('canonical points at the page itself, never at the other language', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/$/)
  })

  test('translates the nav labels', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    const labels = await page.locator('header nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Articles', 'À propos', 'Services', 'Contact'])
  })
})
