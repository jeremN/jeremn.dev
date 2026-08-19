import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const EMAIL = 'jeremie.nehlil.freelance@proton.me'
const EXTERNAL = [
  'https://www.malt.fr/profile/jeremienehlil',
  'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-n%C3%A9hlil-36932a41/',
  'https://github.com/jeremN',
]

test.describe('freelance page', () => {
  test('offers a single primary action', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    const cta = page.locator('[data-cta]')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', `mailto:${EMAIL}`)
  })

  test('lists every service and every way to work', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    await expect(page.locator('[data-service]')).toHaveCount(6)
    await expect(page.locator('[data-how] li')).toHaveCount(4)
  })

  // Both pages read src/lib/services.ts. If one ever retypes the list, the
  // titles stop matching and this fails — which is the whole point of the
  // shared module.
  test('shows the same services as the homepage, in the same order', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const home = await page.locator('[data-service] h3').allTextContents()

    await page.goto(`${BASE}/freelance`)
    const freelance = await page.locator('[data-service] h3').allTextContents()

    expect(freelance.map((t) => t.trim())).toEqual(home.map((t) => t.trim()))
    expect(freelance.length).toBe(6)
  })

  test('lists every contact route from the CV', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    for (const href of EXTERNAL) {
      await expect(page.locator(`[data-routes] a[href="${href}"]`)).toBeVisible()
    }
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
  })

  test('external links carry rel="noopener"', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    const external = page.locator('[data-routes] a[target="_blank"]')
    const count = await external.count()
    expect(count).toBe(EXTERNAL.length)
    for (let i = 0; i < count; i++) {
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/)
    }
  })

  test('links to the email without printing the address', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
    await expect(page.locator('main')).not.toContainText('@proton.me')
  })

  test('hides the footer CTA, because the page is the CTA', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    await expect(page.locator('footer a:has(h2)')).toHaveCount(0)
  })

  // The v1 page used a bespoke mint for availability. v2 has no mint token, and
  // the header and the homepage both use the accent, so the page converged on
  // one treatment rather than keeping a one-off colour.
  test('uses the v2 page template', async ({ page }) => {
    await page.goto(`${BASE}/freelance`)
    await expect(page.locator('main')).toHaveCSS('max-width', '1000px')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Available for\s+your team/)
    await expect(page.locator('h1 [data-doodle="underline"], h1 svg').first()).toBeAttached()
  })
})
