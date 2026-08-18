import { expect, test } from '@playwright/test'
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
