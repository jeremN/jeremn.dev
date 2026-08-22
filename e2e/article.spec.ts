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

test.describe('article illustration', () => {
  // Curated per src/lib/article-illustrations.ts: each slug maps to its own
  // drawn mark, so this also guards against two posts silently sharing one.
  const POST_TO_MARK: Array<[slug: string, mark: string]> = [
    ['best-model-still-needs-rules', 'xiaohei-article-best-model-still-needs-rules'],
    ['ten-months-of-svelte-5', 'xiaohei-article-ten-months-of-svelte-5'],
    ['who-checks-the-agents-tests', 'xiaohei-article-who-checks-the-agents-tests'],
  ]

  for (const [slug, mark] of POST_TO_MARK) {
    test(`${slug} renders its own illustration, once for desktop and once for mobile`, async ({ page }) => {
      await page.goto(`${BASE}/blog/${slug}`)
      const marks = page.locator(`[data-doodle="${mark}"]`)
      await expect(marks).toHaveCount(2)
      for (const instance of await marks.all()) {
        await expect(instance).toHaveAttribute('aria-hidden', 'true')
      }
    })
  }

  test('the desktop illustration sits beside the title column, not above or below it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/blog/best-model-still-needs-rules`)
    const title = page.locator('h1')
    const desktopMark = page.locator('[data-doodle="xiaohei-article-best-model-still-needs-rules"]').first()
    await expect(desktopMark).toBeVisible()

    const [titleBox, markBox] = await Promise.all([title.boundingBox(), desktopMark.boundingBox()])
    if (!titleBox || !markBox) throw new Error('no box')

    // Side-by-side, not stacked: the mark starts to the right of the title's
    // own box, and the two boxes share some vertical range rather than one
    // sitting entirely above or below the other.
    expect(markBox.x).toBeGreaterThan(titleBox.x + titleBox.width)
    const overlap = Math.min(titleBox.y + titleBox.height, markBox.y + markBox.height) - Math.max(titleBox.y, markBox.y)
    expect(overlap).toBeGreaterThan(0)
  })

  test('the desktop mark and the full-bleed mobile mark swap on resize', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/blog/ten-months-of-svelte-5`)
    const marks = page.locator('[data-doodle="xiaohei-article-ten-months-of-svelte-5"]')
    await expect(marks).toHaveCount(2)
    // Source order: the desktop instance (hidden below lg) comes first, then
    // the full-bleed mobile instance (hidden at lg and up).
    await expect(marks.nth(0)).toBeHidden()
    await expect(marks.nth(1)).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(marks.nth(0)).toBeVisible()
    await expect(marks.nth(1)).toBeHidden()
  })

  test('the mobile illustration reaches both edges of the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/blog/ten-months-of-svelte-5`)
    const mark = page.locator('[data-doodle="xiaohei-article-ten-months-of-svelte-5"]').nth(1)
    const box = await mark.boundingBox()
    if (!box) throw new Error('no box')
    expect(box.x).toBeLessThanOrEqual(1)
    expect(box.x + box.width).toBeGreaterThanOrEqual(389)
  })

  test('the illustration is present in both light and dark theme without erroring', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`${BASE}/blog/who-checks-the-agents-tests`)
    const marks = page.locator('[data-doodle="xiaohei-article-who-checks-the-agents-tests"]')

    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
    await expect(marks).toHaveCount(2)

    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
    await expect(marks).toHaveCount(2)

    expect(errors).toEqual([])
  })
})
