import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('writing index', () => {
  test('uses the editorial title with the underline mark', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('h1')).toContainText('Notes from the workbench')
    await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
  })

  test('renders the title in the display serif', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const family = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toContain('Newsreader')
  })

  test('a row carries a stacked date, a category and a reading time', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const row = page.locator('[data-post-row]').first()
    await expect(row.locator('[data-date]')).toBeVisible()
    await expect(row.locator('[data-meta]')).toContainText(/min read/i)
  })

  test('the index date block has no colour fill', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const bg = await page
      .locator('[data-post-row] [data-date]')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    // Spec 8.1: coloured blocks are the homepage teaser only.
    expect(bg).toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('writing index vignettes', () => {
  // The header (telescope) vignette renders twice, sized for its breakpoint:
  // full illustration on desktop, a smaller full illustration as the mobile
  // hero (never cropped, and never swapped for the footer scene, which would
  // read as the same illustration as the home page's hero). The footer
  // vignette renders once, below the row list, desktop only. Both are
  // decorative Doodle components, so assert presence and the accessibility
  // contract rather than pixel content.

  test('the header vignette renders on both mobile and desktop, never cropped', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/blog`)
    const header = page.locator('[data-doodle="xiaohei-writing-header"]')
    await expect(header).toHaveCount(2)
    await expect(header.nth(0)).toBeHidden()
    await expect(header.nth(1)).toBeVisible()
    for (const mark of await header.all()) {
      await expect(mark).toHaveAttribute('aria-hidden', 'true')
    }

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(header.nth(0)).toBeVisible()
    await expect(header.nth(1)).toBeHidden()
  })

  test('the footer vignette renders once, after the row list, for desktop only', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const footer = page.locator('[data-doodle="xiaohei-writing-footer"]')
    await expect(footer).toHaveCount(1)
    await expect(footer).toHaveAttribute('aria-hidden', 'true')

    const order = await page.evaluate(() => {
      const list = document.querySelector('ul')
      const mark = document.querySelector('[data-doodle="xiaohei-writing-footer"]')
      if (!list || !mark) return 'missing'
      // DOCUMENT_POSITION_FOLLOWING means `mark` comes after `list`.
      return (list.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? 'after' : 'before'
    })
    expect(order).toBe('after')
  })

  test('the vignettes are present in both light and dark theme without erroring', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`${BASE}/blog`)
    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
    await expect(page.locator('[data-doodle="xiaohei-writing-header"]').first()).toBeAttached()
    await expect(page.locator('[data-doodle="xiaohei-writing-footer"]').first()).toBeAttached()

    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
    await expect(page.locator('[data-doodle="xiaohei-writing-header"]').first()).toBeAttached()
    await expect(page.locator('[data-doodle="xiaohei-writing-footer"]').first()).toBeAttached()

    expect(errors).toEqual([])
  })
})

test.describe('writing index filter', () => {
  test('lists All plus every tag in use', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const filters = page.locator('[data-filter]')
    await expect(filters.first()).toHaveText(/all/i)
    expect(await filters.count()).toBeGreaterThan(1)
  })

  test('filtering hides the rows that do not carry the tag', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const total = await page.locator('[data-post-row]').count()

    const tagButton = page.locator('[data-filter]').nth(1)
    const tag = (await tagButton.getAttribute('data-filter'))!
    await tagButton.click()

    const visible = page.locator('li:not([hidden]) [data-post-row]')
    const shown = await visible.count()
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThanOrEqual(total)

    for (const row of await visible.all()) {
      await expect(row.locator('[data-meta]')).toContainText(new RegExp(tag, 'i'))
    }
  })

  test('the active filter is marked for assistive technology', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-filter][aria-pressed="true"]')).toHaveText(/all/i)
    await page.locator('[data-filter]').nth(1).click()
    await expect(page.locator('[data-filter][aria-pressed="true"]')).not.toHaveText(/all/i)
  })

  test('every row is listed when JavaScript never runs', async ({ browser }) => {
    // The list must be complete without script. The filter is an enhancement.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${BASE}/blog`)
    expect(await page.locator('[data-post-row]').count()).toBeGreaterThan(0)
    await expect(page.locator('li[hidden]')).toHaveCount(0)
    await context.close()
  })
})

test.describe('no v1 typeface survives', () => {
  // The four v1 faces are uninstalled: /cv-print was the last consumer and it
  // joined v2 too. The names stay in this list on purpose. A rule that still
  // asks for "Fraunces" would now fall through to a system serif and look
  // almost right, which is exactly the kind of regression that goes unnoticed.
  const LEGACY = ['Fraunces', 'Hanken', 'Inter', 'JetBrains']

  for (const path of ['/', '/blog', '/blog/stryker-on-a-svelte-monorepo', '/cv', '/about', '/contact', '/freelance', '/404']) {
    test(`no legacy face is painted on ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`)
      const families = await page.evaluate(() =>
        [...document.querySelectorAll('main *, header *, footer *')]
          .map((el) => getComputedStyle(el).fontFamily)
          .filter((f, i, a) => a.indexOf(f) === i),
      )
      const joined = families.join(' ')
      for (const face of LEGACY) expect(joined).not.toContain(face)
      // And the v2 faces are actually in use, so an empty result cannot pass.
      expect(joined).toMatch(/Newsreader|Geist/)
    })
  }
})

test.describe('hover is colour only', () => {
  /** Offset of a child inside its own row, which no amount of page scrolling
   *  changes. An absolute boundingBox() reads a scroll as movement, and
   *  hover() scrolls. A transform still shows up here. */
  const offsetIn = (row: Locator, child: Locator) =>
    Promise.all([row.boundingBox(), child.boundingBox()]).then(([r, c]) => {
      if (!r || !c) throw new Error('no box')
      return { dx: +(c.x - r.x).toFixed(2), dy: +(c.y - r.y).toFixed(2), w: c.width, h: c.height }
    })

  // A post row used to nudge its title right and lift its mark. Hover now
  // changes colour and nothing else. Measure the geometry: a transform is
  // invisible to any assertion on classes or computed colour.
  test('hovering a post row moves neither the title nor the mark', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    const row = page.locator('[data-post-row]').first()
    const title = row.locator('[data-title]')
    const mark = row.locator('[data-doodle]')

    await row.scrollIntoViewIfNeeded()
    const before = {
      title: await offsetIn(row, title),
      mark: await offsetIn(row, mark),
      colour: await title.evaluate((el) => getComputedStyle(el).color),
    }

    await row.hover()
    await page.waitForTimeout(350)

    expect(await offsetIn(row, title)).toEqual(before.title)
    expect(await offsetIn(row, mark)).toEqual(before.mark)
    // And the hover does something, so a dead selector cannot pass this.
    expect(await title.evaluate((el) => getComputedStyle(el).color)).not.toBe(before.colour)
  })

  test('the keep-reading arrow does not slide', async ({ page }) => {
    // The newest post is the one guaranteed to have an older one. Pointing at
    // a fixed slug skipped this silently the moment it was the oldest.
    await page.goto(`${BASE}/blog`)
    const newest = await page.locator('[data-post-row]').first().getAttribute('href')
    await page.goto(newest!)
    const link = page.locator('[data-keep-reading] a')
    await expect(link).toHaveCount(1)
    const arrow = link.locator('span[aria-hidden="true"]')

    await link.scrollIntoViewIfNeeded()
    const before = await offsetIn(link, arrow)
    const beforeColour = await arrow.evaluate((el) => getComputedStyle(el).color)

    await link.hover()
    await page.waitForTimeout(350)

    expect(await offsetIn(link, arrow)).toEqual(before)
    expect(await arrow.evaluate((el) => getComputedStyle(el).color)).not.toBe(beforeColour)
  })
})
