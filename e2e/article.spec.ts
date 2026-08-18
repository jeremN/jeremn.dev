import { expect, test, type Page } from '@playwright/test'
import { BASE } from '../site.config.mjs'

async function firstPost(page: Page) {
  await page.goto(`${BASE}/blog`)
  const href = await page.locator('[data-post-row]').first().getAttribute('href')
  await page.goto(href!)
}

test.describe('article template', () => {
  test('carries the back link to the index', async ({ page }) => {
    await firstPost(page)
    await expect(page.locator('[data-back]')).toContainText(/all notes/i)
  })

  test('the title uses the display serif and carries the underline', async ({ page }) => {
    await firstPost(page)
    const family = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toContain('Newsreader')
    await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
  })

  test('body copy is the sans, not the mono', async ({ page }) => {
    await firstPost(page)
    // Spec section 5: the monospace is an accent and never the default voice.
    const family = await page
      .locator('article.prose p')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toContain('Geist')
    expect(family).not.toContain('Mono')
  })

  test('section headings are numbered by a counter, not by the Markdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await firstPost(page)
    const h2 = page.locator('article.prose h2').first()

    // getComputedStyle does not resolve counter() — it returns the specified
    // value — so the rendered "01" is not observable here. Assert the wiring
    // instead: the counter increments on the heading and the ordinal draws
    // from it. Both must hold for the number to appear.
    const wiring = await h2.evaluate((el) => ({
      increment: getComputedStyle(el).counterIncrement,
      content: getComputedStyle(el, '::before').content,
      color: getComputedStyle(el, '::before').color,
      reset: getComputedStyle(el.closest('article')!).counterReset,
    }))
    expect(wiring.increment).toContain('article-section')
    expect(wiring.content).toContain('counter(article-section')
    expect(wiring.reset).toContain('article-section')

    // The ordinal must never be baked into the heading text, or it leaks into
    // the table of contents, the outline and any RSS summary.
    await expect(h2).not.toHaveText(/^\s*0\d/)
  })

  test('the ordinal is dropped when the gutter has no room', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await firstPost(page)
    const display = await page
      .locator('article.prose h2')
      .first()
      .evaluate((el) => getComputedStyle(el, '::before').display)
    expect(display).toBe('none')
  })

  test('offers the next article to keep reading', async ({ page }) => {
    await firstPost(page)
    await expect(page.locator('[data-keep-reading]')).toBeVisible()
  })
})
