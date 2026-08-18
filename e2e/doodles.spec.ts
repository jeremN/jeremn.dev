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
