import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('homepage sections', () => {
  test('carries the five sections the design document lists', async ({ page }) => {
    await page.goto(`${BASE}/`)
    for (const hook of ['[data-hero]', '[data-services]', '[data-writing]', '[data-about]', '[data-contact]']) {
      await expect(page.locator(hook)).toHaveCount(1)
    }
  })

  test('lists six services', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-service]')).toHaveCount(6)
  })

  test('teases at most three posts and links to the full index', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const rows = page.locator('[data-writing] [data-post-row]')
    expect(await rows.count()).toBeLessThanOrEqual(3)
    await expect(page.locator(`[data-writing] a[href$="/blog"]`)).toBeVisible()
  })

  test('the teaser rows are the teaser variant, so they carry no summary', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const rows = page.locator('[data-writing] [data-post-row]')
    const count = await rows.count()
    test.skip(count === 0, 'no published posts')
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toHaveAttribute('data-variant', 'teaser')
    }
  })

  // The dark theme's butter is a mid gold. Under the dark ink token it measured
  // 2.4:1, so the chips carry their own tokens. Assert the ratio, not the hex:
  // a future palette nudge must not be able to reintroduce this quietly.
  test('the coloured date chips clear AA in both themes', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const chips = page.locator('[data-writing] [data-post-row] [data-date]')
    test.skip((await chips.count()) === 0, 'no published posts')

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => { document.documentElement.dataset.theme = t }, theme)
      const count = await chips.count()
      for (let i = 0; i < count; i++) {
        const ratio = await chips.nth(i).evaluate((el) => {
          const parse = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
          const lum = (rgb: number[]) => {
            const [r, g, b] = rgb.map((c) => {
              const s = c / 255
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          const cs = getComputedStyle(el)
          let bg = cs.backgroundColor
          // A transparent chip inherits the section ground; walk up for it.
          let node: HTMLElement | null = el as HTMLElement
          while (bg === 'rgba(0, 0, 0, 0)' && node?.parentElement) {
            node = node.parentElement
            bg = getComputedStyle(node).backgroundColor
          }
          const a = lum(parse(cs.color))
          const b = lum(parse(bg))
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
        })
        expect(ratio, `chip ${i} in ${theme}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  // Section 8.1 resolves this: coloured blocks on the homepage teaser, plain
  // metadata on the full index. A regression on either side is a design defect,
  // so both sides are asserted.
  test('the first teaser date block is coloured and the index equivalent is not', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const teaser = page.locator('[data-writing] [data-post-row] [data-date]').first()
    test.skip((await teaser.count()) === 0, 'no published posts')
    const teaserBg = await teaser.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(teaserBg).not.toBe('rgba(0, 0, 0, 0)')

    await page.goto(`${BASE}/blog`)
    const indexBg = await page
      .locator('[data-post-row] [data-date]')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(indexBg).toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('hero landscape', () => {
  test('shows the simplified band on mobile and the full one on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-landscape-variant="mobile"]')).toBeVisible()
    await expect(page.locator('[data-landscape-variant="desktop"]')).toBeHidden()

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.locator('[data-landscape-variant="desktop"]')).toBeVisible()
    await expect(page.locator('[data-landscape-variant="mobile"]')).toBeHidden()
  })

  // Step 6 addresses these three regions by name. Renaming one would break the
  // Living Canvas silently, because a missing hotspot simply never reacts.
  test('keeps the three named hotspots in both compositions', async ({ page }) => {
    await page.goto(`${BASE}/`)
    for (const id of ['water', 'sun', 'plant']) {
      await expect(page.locator(`[data-landscape-variant="desktop"] #${id}`)).toHaveCount(1)
    }
    for (const id of ['water', 'sun']) {
      await expect(page.locator(`[data-landscape-variant="mobile"] #${id}`)).toHaveCount(1)
    }
  })

  test('is decorative, so assistive technology skips it', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-landscape]')).toHaveAttribute('aria-hidden', 'true')
  })
})

test.describe('the galaxy left the front door', () => {
  test('the homepage runs no WebGL canvas', async ({ page }) => {
    await page.goto(`${BASE}/`)
    // The Living Canvas is a 2D canvas and belongs here. The galaxy is the one
    // that left, so name it rather than counting canvases.
    await expect(page.locator('canvas#galaxy')).toHaveCount(0)
    await expect(page.locator('canvas:not([data-draw-canvas])')).toHaveCount(0)
  })

  test('the galaxy still runs on its lab route', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab/galaxy`)
    await expect(page.locator('canvas#galaxy')).toBeAttached()
  })

  test('the lab route stays out of the index', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab/galaxy`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
