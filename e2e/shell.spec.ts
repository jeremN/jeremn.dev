import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('site header', () => {
  test('shows the availability dot with an accessible label', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const dot = page.locator('[data-availability]')
    await expect(dot).toBeVisible()
    await expect(dot).toHaveText(/available/i)
  })

  test('shrinks from 72px to 56px once the page is scrolled', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const header = page.locator('header')
    await expect(async () => {
      expect(await header.evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(72)
    }).toPass({ timeout: 2000 })

    await page.evaluate(() => window.scrollTo(0, 400))
    await expect(async () => {
      expect(await header.evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(56)
    }).toPass({ timeout: 2000 })
  })

  test('marks the current section with aria-current', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('header a[aria-current="page"]')).toHaveText(/writing/i)
  })

  test('the dot does not pulse after the first load', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-availability] [data-pulse]')).toHaveClass(/is-first-load/)
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-availability] [data-pulse]')).not.toHaveClass(/is-first-load/)
  })
})

test.describe('site footer', () => {
  test('carries the three meta columns', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const footer = page.locator('footer')
    await expect(footer).toContainText(`© ${new Date().getFullYear()} jeremn.dev`)
    await expect(footer).toContainText('Based in France')
    await expect(footer).toContainText('Remote friendly')
  })

  test('carries one primary CTA', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    // Step 4 repointed this from /freelance to /contact. Assert the heading,
    // not just any /contact link, or the nav link would satisfy it.
    const cta = page.locator('footer a:has(h2)')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', /\/contact$/)
  })
})

test.describe('navigation after About and Contact ship', () => {
  test('carries the four primary destinations', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const labels = await page.locator('header nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Writing', 'About', 'CV', 'Contact'])
  })

  test('the footer CTA now leads to Contact', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('footer a[href$="/contact"]')).toBeVisible()
  })

  test('freelance stays reachable from the footer', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('footer a[href$="/freelance"]')).toBeVisible()
  })
})
