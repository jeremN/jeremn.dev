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
})

test.describe('navigation after About and Contact ship', () => {
  test('carries the four primary destinations', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const labels = await page.locator('header nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Writing', 'About', 'Services', 'Contact'])
  })
})

test.describe('narrow viewports', () => {
  // Below 40rem the nav moves into a side panel, leaving the wordmark, the
  // language switch, the theme toggle and the burger on one row. body carries
  // [overflow-wrap:anywhere], so an overrun would break "jeremn.dev" mid-word
  // rather than push the page wide. Assert the row directly.
  test('the header stays on one line down to 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(`${BASE}/`)

    await expect(page.locator('header nav')).toBeHidden()
    await expect(page.locator('#menu-open')).toBeVisible()

    const centers = await page
      .locator('header a[href$="/"], header #theme-toggle, header #menu-open, header [data-lang-switch]')
      .evaluateAll((els) =>
        els.map((el) => {
          const r = (el as HTMLElement).getBoundingClientRect()
          return Math.round(r.top + r.height / 2)
        }),
      )
    expect(new Set(centers).size).toBe(1)

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

test.describe('mobile menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/blog`)
  })

  test('opens a side panel carrying the four destinations', async ({ page }) => {
    const burger = page.locator('#menu-open')
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await burger.click()

    const panel = page.locator('#mobile-menu')
    await expect(panel).toBeVisible()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    const labels = await panel.locator('nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Writing', 'About', 'Services', 'Contact'])
    await expect(panel.locator('a[aria-current="page"]')).toHaveText(/writing/i)
  })

  test('closes on Escape, the close button, and a tap on the backdrop', async ({ page }) => {
    const burger = page.locator('#menu-open')
    const panel = page.locator('#mobile-menu')

    await burger.click()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(burger).toHaveAttribute('aria-expanded', 'false')

    await burger.click()
    await page.locator('#menu-close').click()
    await expect(panel).toBeHidden()

    await burger.click()
    await expect(panel).toBeVisible()
    await page.mouse.click(20, 400)
    await expect(panel).toBeHidden()
  })

  test('is absent from wider viewports', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await expect(page.locator('#menu-open')).toBeHidden()
    await expect(page.locator('header nav')).toBeVisible()
  })
})

test.describe('mobile footer', () => {
  test('lays its items out in a row rather than a column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/blog`)
    const tops = await page.locator('footer span').evaluateAll((els) =>
      els.map((el) => Math.round((el as HTMLElement).getBoundingClientRect().top)),
    )
    // Three items, at most two lines: the row may wrap, it must not stack.
    expect(new Set(tops).size).toBeLessThanOrEqual(2)
  })
})
