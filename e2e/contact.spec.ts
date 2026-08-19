import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

// Kept in step with src/lib/cv.ts. The page must not retype these.
const EMAIL = 'jeremie.nehlil.freelance@proton.me'
const EXTERNAL = [
  'https://www.malt.fr/profile/jeremienehlil',
  'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-n%C3%A9hlil-36932a41/',
  'https://github.com/jeremN',
]

test.describe('contact page', () => {
  test('offers a single primary action', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const cta = page.locator('[data-cta]')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', `mailto:${EMAIL}`)
  })

  test('lists every contact route from the CV', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    for (const href of EXTERNAL) {
      await expect(page.locator(`[data-routes] a[href="${href}"]`)).toBeVisible()
    }
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
  })

  test('external links carry rel="noopener"', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const external = page.locator('[data-routes] a[target="_blank"]')
    const count = await external.count()
    expect(count).toBe(EXTERNAL.length)
    for (let i = 0; i < count; i++) {
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/)
    }
  })

  // The mailto link is the whole point; printing the address beside it added
  // nothing and put a harvestable string on the page.
  test('links to the email without printing the address', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
    await expect(page.locator('main')).not.toContainText('@proton.me')
  })

  test('hides the footer CTA, because the page is the CTA', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('footer a[href$="/contact"]')).toHaveCount(0)
  })
})
