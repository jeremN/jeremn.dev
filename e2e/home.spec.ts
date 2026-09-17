import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('homepage sections', () => {
  test('carries the five sections the design document lists', async ({ page }) => {
    await page.goto(`${BASE}/`)
    for (const hook of ['[data-hero]', '[data-services]', '[data-writing]', '[data-about]', '[data-contact]']) {
      await expect(page.locator(hook)).toHaveCount(1)
    }
  })

  test('lists six services, each with an icon', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-service]')).toHaveCount(6)
    await expect(page.locator('[data-service] [data-doodle]')).toHaveCount(6)
  })

  test('renders the about and contact mascots', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-about] [data-doodle="xiaohei-about"]')).toHaveCount(1)
    await expect(page.locator('[data-contact] [data-doodle="xiaohei-contact"]')).toHaveCount(1)
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

  // The date is one colour and one weight on both the teaser and the full
  // index. The coloured chips are gone, so this guards the convergence: a chip
  // coming back on one side and not the other is the regression to catch.
  test('renders the date the same way as the full index', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const teaser = page.locator('[data-writing] [data-post-row] [data-date]').first()
    test.skip((await teaser.count()) === 0, 'no published posts')
    const onHome = await teaser.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { bg: cs.backgroundColor, color: cs.color, weight: cs.fontWeight }
    })

    await page.goto(`${BASE}/blog`)
    const onIndex = await page
      .locator('[data-post-row] [data-date]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el)
        return { bg: cs.backgroundColor, color: cs.color, weight: cs.fontWeight }
      })

    expect(onHome).toEqual(onIndex)
    expect(onHome.bg).toBe('rgba(0, 0, 0, 0)')
    expect(onHome.weight).toBe('400')
  })

  test('every teaser date is the same colour', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const colours = await page
      .locator('[data-writing] [data-post-row] [data-date]')
      .evaluateAll((els) => [...new Set(els.map((el) => getComputedStyle(el).color))])
    test.skip(colours.length === 0, 'no published posts')
    expect(colours).toHaveLength(1)
  })

  test('the teaser date clears AA', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const date = page.locator('[data-writing] [data-post-row] [data-date]').first()
    test.skip((await date.count()) === 0, 'no published posts')

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t
      }, theme)
      const ratio = await date.evaluate((el) => {
        const parse = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
        const lum = (rgb: number[]) => {
          const [r, g, b] = rgb.map((c) => {
            const s = c / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const cs = getComputedStyle(el)
        let node: HTMLElement | null = el as HTMLElement
        let bg = cs.backgroundColor
        while (bg === 'rgba(0, 0, 0, 0)' && node?.parentElement) {
          node = node.parentElement
          bg = getComputedStyle(node).backgroundColor
        }
        const a = lum(parse(cs.color))
        const b = lum(parse(bg))
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      })
      expect(ratio, `teaser date in ${theme}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

test.describe('hero mascot', () => {
  test('shows the full illustration, uncropped, on both mobile and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/`)
    // The same xiaohei-hero doodle renders twice, sized for its breakpoint:
    // full illustration (hidden below lg) and a smaller full illustration
    // (hidden at lg and up), never cropped. Order matches the source,
    // desktop instance first.
    const hero = page.locator('[data-hero] [data-doodle="xiaohei-hero"]')
    await expect(hero).toHaveCount(2)
    await expect(hero.nth(0)).toBeHidden()
    await expect(hero.nth(1)).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(hero.nth(0)).toBeVisible()
    await expect(hero.nth(1)).toBeHidden()
  })

  test('shows the developer tag pill above the headline', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-hero]').getByText('01 / Freelance software engineer')).toBeVisible()
  })

  test('doodles are decorative, so assistive technology skips them', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const doodles = page.locator('[data-doodle]')
    expect(await doodles.count()).toBeGreaterThan(0)
    const allHidden = await doodles.evaluateAll((els) => els.every((el) => el.getAttribute('aria-hidden') === 'true'))
    expect(allHidden).toBe(true)
  })
})

// Step 1 retired the Living Canvas (the hero drawing surface and its
// water/sun/plant hotspots). This guards the removal itself, not only the
// replacement above, so a stray re-import cannot bring the markup back
// without any assertion here catching it.
test.describe('the retired Living Canvas stays gone', () => {
  test('none of its markup is on the page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-landscape]')).toHaveCount(0)
    await expect(page.locator('[data-landscape-variant]')).toHaveCount(0)
    await expect(page.locator('[data-draw-mode]')).toHaveCount(0)
    await expect(page.locator('[data-draw-hint]')).toHaveCount(0)
    for (const id of ['water', 'sun', 'plant']) {
      await expect(page.locator(`#${id}`)).toHaveCount(0)
    }
  })
})

test.describe('no page runs WebGL', () => {
  test('the homepage runs no WebGL canvas', async ({ page }) => {
    await page.goto(`${BASE}/`)
    // The galaxy left in step 5; the Living Canvas's own 2D <canvas> was
    // retired in step 1. The lab routes that kept the galaxy runnable are gone
    // too, and `three` with them, so no page in the repo can render one.
    await expect(page.locator('canvas')).toHaveCount(0)
  })
})

for (const locale of ['', '/fr']) {
  test(`Home services use four columns on desktop (${locale || 'en'})`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto(`${BASE}${locale}/`)
    const services = page.locator('[data-service]')
    await expect(services).toHaveCount(6)
    const rows = await services.evaluateAll((elements) => {
      const counts = new Map<number, number>()
      for (const element of elements) {
        const top = Math.round(element.getBoundingClientRect().top)
        counts.set(top, (counts.get(top) ?? 0) + 1)
      }
      return [...counts.values()]
    })
    expect(rows).toEqual([4, 2])
    for (const service of await services.all()) {
      await expect(service.locator('h3')).toHaveCSS('font-size', '18px')
      await expect(service.locator('p')).toHaveCSS('font-size', '16px')
    }
  })

  for (const width of [390, 640, 768, 1024]) {
    for (const route of ['/', '/blog']) {
      test(`Post dates stay clear of titles at ${width}px (${locale}${route})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${BASE}${locale}${route}`)
        const rows = page.locator('[data-post-row]')
        expect(await rows.count()).toBeGreaterThan(0)
        for (const row of await rows.all()) {
          await expect(row.locator('[data-date]')).toHaveCount(1)
          await expect(row.locator('[data-meta] [data-date]')).toHaveCSS('font-size', '12px')
          const title = await row.locator('[data-title]').boundingBox()
          const date = await row.locator('[data-date]').boundingBox()
          expect(title).not.toBeNull()
          expect(date).not.toBeNull()
          const overlap = title!.x < date!.x + date!.width && date!.x < title!.x + title!.width
            && title!.y < date!.y + date!.height && date!.y < title!.y + title!.height
          expect(overlap).toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      })
    }
  }

  test(`Home actions support keyboard navigation (${locale || 'en'})`, async ({ page }) => {
    await page.goto(`${BASE}${locale}/`)
    const action = page.locator('[data-hero-cta]')
    await action.focus()
    await expect(action).toBeFocused()
    await expect(action).toHaveCSS('outline-style', 'solid')
    const box = await action.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${locale}/contact/?$`))
  })
}
