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
