import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'

/** The resolved theme, read the way the browser resolves it. */
const resolved = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-theme'),
    scheme: getComputedStyle(document.documentElement).colorScheme,
  }))

/** The ground colour the browser actually painted, as `rgb(r, g, b)`. */
const ground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.describe('theme resolves in three states', () => {
  // Asserting the two OS preferences produce DIFFERENT grounds is what proves
  // light-dark() is resolving. Asserting each one's colour would just restate
  // the palette, and would need editing every time the palette changes.
  test('with no stored choice, the OS preference decides and no attribute is stamped', async ({ browser }) => {
    const dark = await browser.newContext({ colorScheme: 'dark' })
    const light = await browser.newContext({ colorScheme: 'light' })
    const [darkPage, lightPage] = [await dark.newPage(), await light.newPage()]

    await darkPage.goto(`${BASE}/`)
    await lightPage.goto(`${BASE}/`)

    expect(await resolved(darkPage)).toEqual({ attr: null, scheme: 'light dark' })
    expect(await resolved(lightPage)).toEqual({ attr: null, scheme: 'light dark' })
    expect(await ground(darkPage)).not.toBe(await ground(lightPage))

    await dark.close()
    await light.close()
  })

  // The regression-prone state: an explicit light choice must beat a dark OS.
  test('an explicit light choice beats a dark OS', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/`)
    await page.evaluate(() => localStorage.setItem('theme', 'light'))
    await page.reload()
    expect(await resolved(page)).toEqual({ attr: 'light', scheme: 'light' })
    await ctx.close()
  })

  test('the toggle flips the resolved theme and persists across reload', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/`)
    await page.locator('#theme-toggle').click()
    expect((await resolved(page)).attr).toBe('dark')
    await page.reload()
    expect(await resolved(page)).toEqual({ attr: 'dark', scheme: 'dark' })
    await ctx.close()
  })

  test('the theme-color meta tracks the resolved theme', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/`)
    const before = await page.locator('#theme-color').getAttribute('content')
    await page.locator('#theme-toggle').click()
    const after = await page.locator('#theme-color').getAttribute('content')
    expect(before).not.toBe(after)
    await ctx.close()
  })
})
