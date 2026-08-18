import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('hero lab', () => {
  test('renders the six warp-law tiles', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab`)
    await expect(page.locator('canvas#lab')).toBeAttached()
    await expect(page.locator('.hero-dark .rounded-md')).toHaveCount(6)
  })

  test('links to the retired galaxy hero', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab`)
    await expect(page.locator(`a[href$="/hero-lab/galaxy"]`)).toBeVisible()
  })

  // The tile canvas is opaque black in either theme. Under the light palette
  // the overlay's `bg-ground/55` resolved to a mid grey and the body copy
  // measured about 1.9:1, so the overlay pins the dark tokens. Assert the
  // ratio: the failure is invisible in the markup and only shows in one theme.
  test('the tile captions clear AA in both themes', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab`)

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t
      }, theme)

      const worst = await page.evaluate(() => {
        const lum = (v: string) => {
          const [r, g, b] = (v.match(/[\d.]+/g) ?? [])
            .slice(0, 3)
            .map(Number)
            .map((c) => {
              const s = c / 255
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
            })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const solidBehind = (el: Element) => {
          let node: Element | null = el
          let bg = getComputedStyle(node).backgroundColor
          while (bg === 'rgba(0, 0, 0, 0)' && node?.parentElement) {
            node = node.parentElement
            bg = getComputedStyle(node).backgroundColor
          }
          return bg
        }
        let min = Infinity
        document.querySelectorAll('.hero-dark .rounded-md *').forEach((el) => {
          if (!el.textContent?.trim() || el.children.length) return
          const a = lum(getComputedStyle(el).color)
          const b = lum(solidBehind(el))
          min = Math.min(min, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05))
        })
        return min
      })

      expect(worst, `worst tile caption ratio in ${theme}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

test.describe('galaxy lab', () => {
  test('keeps the retired hero runnable', async ({ page }) => {
    await page.goto(`${BASE}/hero-lab/galaxy`)
    await expect(page.locator('canvas#galaxy')).toBeAttached()
    await expect(page.locator('.hero-dark')).toHaveCount(1)
  })

  test('stays out of the index and the sitemap', async ({ page, request }) => {
    await page.goto(`${BASE}/hero-lab/galaxy`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

    const res = await request.get('/sitemap-0.xml')
    expect(res.status()).toBe(200)
    expect(await res.text()).not.toContain('hero-lab')
  })
})
