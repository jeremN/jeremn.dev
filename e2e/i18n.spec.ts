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

test.describe('language switcher', () => {
  test('leads to the twin of the current page, not to the other home', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const toFr = page.locator('[data-lang-switch]')
    await expect(toFr).toHaveAttribute('href', `${BASE}/fr/`)
    await toFr.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('[data-lang-switch]')).toHaveAttribute('href', `${BASE}/`)
  })

  test('sits outside the nav, so the four destinations stay four', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('header nav [data-lang-switch]')).toHaveCount(0)
    await expect(page.locator('header [data-lang-switch]')).toHaveCount(1)
  })

  test('keeps the header on one line at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      const tops = await page
        .locator('header nav a, header [data-lang-switch]')
        .evaluateAll((els) => els.map((el) => (el as HTMLElement).getBoundingClientRect().top))
      expect(new Set(tops.map((t) => Math.round(t))).size, path).toBe(1)
    }
  })
})

test.describe('French services page', () => {
  test('renders at /fr/services with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/services`)
    await expect(page.locator('h1')).toContainText('Des systèmes utiles,')
    await expect(page.locator('h1')).toContainText('construits avec intention.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('pairs with the English page through hreflang', async ({ page }) => {
    await page.goto(`${BASE}/fr/services`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/services$/)
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/services$/)
  })

  test('lists the same number of offerings in both languages', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const en = await page.locator('h2:text("01 / Development") ~ ul h4').count()
    await page.goto(`${BASE}/fr/services`)
    const fr = await page.locator('h2:text("01 / Développement") ~ ul h4').count()
    expect(fr).toBe(en)
  })

  test('the French home page shows French service names, not English ones', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    const section = page.locator('[data-services]')
    await expect(section).not.toContainText('Frontend web apps')
    await expect(section).not.toContainText('Fullstack features')
    await expect(section).toContainText('Applications web frontend')
  })
})
