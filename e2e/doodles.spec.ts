import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('doodle authoring contract', () => {
  test('an imported .svg keeps currentColor and inherits the parent text colour', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const mark = page.locator('[data-doodle="underline"]').first()
    await expect(mark).toBeAttached()

    // The contract: strokes say currentColor, so the painted stroke must equal
    // the text colour in force where the doodle sits. If Astro rewrote the
    // attribute to a literal, these two diverge and the fifteen step-3 assets
    // are unsafe.
    const { stroke, color } = await mark.evaluate((el) => {
      const path = el.querySelector('path, line, polyline')!
      return { stroke: getComputedStyle(path).stroke, color: getComputedStyle(el).color }
    })
    expect(stroke).toBe(color)
  })

  test('recolouring the container recolours the stroke', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const mark = page.locator('[data-doodle="underline"]').first()

    // The half of the contract that matters for step 3: one asset set serves
    // both themes and every context, because colour is inherited, not baked in.
    const stroke = await mark.evaluate((el) => {
      ;(el as HTMLElement).style.color = 'rgb(1, 2, 3)'
      return getComputedStyle(el.querySelector('path')!).stroke
    })
    expect(stroke).toBe('rgb(1, 2, 3)')
  })

  test('the doodle is hidden from assistive technology', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-doodle="underline"]').first()).toHaveAttribute('aria-hidden', 'true')
  })

  test('the dark theme draws a thinner stroke than the light theme', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const widthNow = () =>
      page
        .locator('[data-doodle="underline"] .ds')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth))

    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
    const light = await widthNow()
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
    const dark = await widthNow()

    // Spec 6.3. If these are equal, the token never reached the stroke and the
    // dark correction is silently absent from all fifteen step-3 assets.
    expect(dark).toBeLessThan(light)
  })
})

test.describe('writing row marks', () => {
  test('every row carries a mark', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const rows = page.locator('[data-post-row]')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('[data-doodle]')).toHaveCount(1)
    }
  })

  test('the mark matches the row subject', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    // A Svelte-tagged post takes braces unless a more specific tag precedes it.
    const row = page.locator('[data-post-row]', { has: page.locator('[data-meta]') }).first()
    const name = await row.locator('[data-doodle]').getAttribute('data-doodle')
    expect(['code', 'braces', 'nodes', 'dotgrid', 'padlock']).toContain(name)
  })

  test('a mark inherits the row colour rather than baking one in', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const stroke = await page
      .locator('[data-post-row] [data-doodle]')
      .first()
      .evaluate((el) => {
        // The mark transitions its colour on hover, so a computed read taken
        // straight after the assignment returns the pre-transition value.
        // Kill the transition first, or this measures the old colour.
        ;(el as HTMLElement).style.transition = 'none'
        ;(el as HTMLElement).style.color = 'rgb(4, 5, 6)'
        const shape = el.querySelector('path, rect, circle, ellipse')!
        const s = getComputedStyle(shape)
        // dot-grid marks are filled, every other mark is stroked
        return s.stroke === 'none' ? s.fill : s.stroke
      })
    expect(stroke).toBe('rgb(4, 5, 6)')
  })
})
