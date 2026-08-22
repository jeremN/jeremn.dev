import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('site header', () => {
  // The indicator was removed from the header. The hero and /freelance still
  // state availability in their own copy, which is where it belongs.
  test('carries no availability indicator', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('header')).not.toContainText(/available/i)
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

})

test.describe('site footer', () => {
  test('carries the two meta columns', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const footer = page.locator('footer')
    await expect(footer).toContainText(`© ${new Date().getFullYear()} jeremn.dev`)
    await expect(footer).toContainText('Based in France')
    await expect(footer).toContainText('Remote friendly')
  })

  test('no longer carries a Freelance link', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('footer a[href$="/freelance"]')).toHaveCount(0)
  })

  // Every real page now sets hideFooterCta (Home, Writing, About, CV, Contact,
  // Freelance): the lab route is the one place left that still renders it, so
  // it is what exercises this still-live code path.
  test('carries one primary CTA where it still renders', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab`)
    // Step 4 repointed this from /freelance to /contact. Assert the heading,
    // not just any /contact link, or the nav link would satisfy it.
    const cta = page.locator('footer a:has(h2)')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', /\/contact$/)
  })
})

test.describe('navigation after About and Contact ship', () => {
  test('carries the five primary destinations', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const labels = await page.locator('header nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Writing', 'About', 'CV', 'Services', 'Contact'])
  })

  test('the footer CTA, where it still renders, leads to Contact', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab`)
    await expect(page.locator('footer a[href$="/contact"]')).toBeVisible()
  })
})

test.describe('narrow viewports', () => {
  // Four destinations plus the wordmark and the theme toggle compete for one
  // row. body carries [overflow-wrap:anywhere], so an overrun does not push the
  // page wide: it breaks "jeremn.dev" and "Contact" mid-word instead, which no
  // overflow guard can see. Assert the row directly.
  test('the header stays on one line down to 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(`${BASE}/`)

    const tops = await page.locator('header nav a').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getBoundingClientRect().top),
    )
    expect(new Set(tops.map((t) => Math.round(t))).size).toBe(1)

    const wordmarkLines = await page
      .locator('header a[href$="/"]')
      .first()
      .evaluate((el) => (el as HTMLElement).getClientRects().length)
    expect(wordmarkLines).toBe(1)
  })

  test('no page scrolls horizontally from 320px to 1440px', async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 })
      for (const path of ['/', '/blog', '/about', '/contact']) {
        await page.goto(`${BASE}${path}`)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1)
      }
    }
  })
})
