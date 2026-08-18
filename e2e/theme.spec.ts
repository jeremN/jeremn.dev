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
  // One page, flipping the emulated OS preference. Two browser contexts plus
  // two navigations intermittently exceeded the default test timeout against a
  // cold preview server; emulateMedia tests the same behaviour on one page.
  test('with no stored choice, the OS preference decides and no attribute is stamped', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(`${BASE}/`)
    expect(await resolved(page)).toEqual({ attr: null, scheme: 'light dark' })
    const darkGround = await ground(page)

    await page.emulateMedia({ colorScheme: 'light' })
    expect(await resolved(page)).toEqual({ attr: null, scheme: 'light dark' })
    const lightGround = await ground(page)

    expect(darkGround).not.toBe(lightGround)
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

/**
 * Resolve a token to the `rgb(r, g, b)` the browser actually paints, inside a
 * given scope.
 *
 * A custom property MUST NOT be read with getPropertyValue here. Its computed
 * value is the substituted token stream, so `--color-ground` comes back as the
 * literal string "light-dark(#ece3d1, #0b0a12)" in BOTH themes. light-dark()
 * only resolves when the token is used in a colour context, so we probe it.
 */
const token = (page: import('@playwright/test').Page, scope: string, name: string) =>
  page.evaluate(
    ([sel, n]) => {
      const host = document.querySelector(sel)
      if (!host) throw new Error(`no element matches ${sel}`)
      const probe = document.createElement('span')
      probe.style.position = 'absolute'
      probe.style.opacity = '0'
      probe.style.color = `var(${n})`
      host.appendChild(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    },
    [scope, name],
  )

const LEGACY_GROUND = { dark: 'rgb(11, 10, 18)', light: 'rgb(236, 227, 209)' }

test.describe('the legacy scope pins the old palette', () => {
  for (const path of ['/cv', '/freelance']) {
    for (const scheme of ['dark', 'light'] as const) {
      test(`${path} keeps the legacy ground in ${scheme}`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: scheme })
        const page = await ctx.newPage()
        await page.goto(`${BASE}${path}`)
        expect(await token(page, '.legacy', '--color-ground')).toBe(LEGACY_GROUND[scheme])
        await ctx.close()
      })
    }
  }
})

/**
 * The first family in a computed `font-family` stack, unquoted.
 *
 * getComputedStyle returns the full fallback stack, for example
 * `"Fraunces Variable", Georgia, serif`. Fonts carry no light-dark(). The
 * value resolves directly from the DOM. No probe span is needed here, unlike
 * the colour tokens above.
 */
const firstFont = (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) throw new Error(`no element matches ${sel}`)
    const stack = getComputedStyle(el).fontFamily
    return stack.split(',')[0].trim().replace(/^["']|["']$/g, '')
  }, selector)

// Expected first font per page. `/blog` reads the four global tokens.
// `/cv` and `/freelance` read the same four tokens through the `.legacy` pin.
const FONT_CASES: Array<{
  path: string
  sans: string
  display: string
  mono: string
  grotesk: string
}> = [
  { path: '/blog', sans: 'Geist Variable', display: 'Newsreader Variable', mono: 'Geist Mono Variable', grotesk: 'Geist Variable' },
  { path: '/cv', sans: 'Inter Variable', display: 'Fraunces Variable', mono: 'JetBrains Mono Variable', grotesk: 'Hanken Grotesk Variable' },
  { path: '/freelance', sans: 'Inter Variable', display: 'Fraunces Variable', mono: 'JetBrains Mono Variable', grotesk: 'Hanken Grotesk Variable' },
]

test.describe('the legacy scope pins the old fonts', () => {
  for (const { path, sans, display, mono, grotesk } of FONT_CASES) {
    test(`${path} resolves all four font tokens`, async ({ page }) => {
      await page.goto(`${BASE}${path}`)

      // body carries no font-* utility. It inherits --font-sans through
      // `body { font-family: var(--font-sans) }`. `.legacy` sits on that
      // same <body>, so its override wins here. This is the path a future
      // refactor could break without anyone noticing.
      expect(await firstFont(page, 'body')).toBe(sans)
      expect(await firstFont(page, 'h1')).toBe(display) // --font-display
      expect(await firstFont(page, '.font-mono')).toBe(mono) // --font-mono
      expect(await firstFont(page, 'header a')).toBe(grotesk) // --font-grotesk, the wordmark
    })
  }
})

/**
 * WCAG 2.1 relative luminance, from an `rgb(r, g, b)` string.
 *
 * The `rgb(` guard is deliberate. A plain token probes back as `rgb(...)`, but
 * a color-mix() value probes back as `color(srgb 0.77 0.74 0.70)` — whose
 * channels are 0-1, not 0-255. Without the guard that misparses silently and
 * reports a passing ratio for an unreadable pair.
 */
const luminance = (rgb: string) => {
  if (!rgb.startsWith('rgb(')) throw new Error(`expected rgb(), got: ${rgb}`)
  const parts = rgb.match(/\d+(\.\d+)?/g)
  if (!parts || parts.length < 3) throw new Error(`unparseable colour: ${rgb}`)
  const chan = parts.slice(0, 3).map((n) => {
    const c = Number(n) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2]
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Pairs whose foreground token is the same in both themes.
const PAIRS: Array<[string, string]> = [
  ['--color-ink', '--color-ground'],
  ['--color-ink', '--color-surface'],
  ['--color-muted', '--color-ground'],
  ['--color-muted', '--color-surface'],
  ['--color-accent', '--color-ground'],
  ['--color-accent', '--color-surface'],
]

/**
 * The eyebrow chip is the one pair whose foreground changes with the theme.
 * Butter is a pale pastel in light and a mid amber in dark, so no single
 * foreground serves both: the chip takes the theme's DARKEST token. That is
 * `ink` (#071b46) on light and `ground` (#14120e) on dark.
 *
 * Asserting ink-on-butter in dark measures 2.65:1 and fails. That is the test
 * being wrong about the design, not the palette being wrong.
 */
const CHIP: Record<'light' | 'dark', [string, string]> = {
  light: ['--color-ink', '--color-butter'],
  dark: ['--color-ground', '--color-butter'],
}

test.describe('v2 tokens clear WCAG AA in both themes', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`every text pair clears 4.5:1 in ${scheme}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: scheme })
      const page = await ctx.newPage()
      await page.goto(`${BASE}/blog`)

      // Probed, not read off the custom property: see the note on `token` above.
      // getPropertyValue would return "light-dark(...)" unresolved in both themes.
      const tokens = await page.evaluate((names: string[]) => {
        const probe = document.createElement('span')
        probe.style.position = 'absolute'
        probe.style.opacity = '0'
        document.body.appendChild(probe)
        const out: Record<string, string> = {}
        for (const n of names) {
          probe.style.color = `var(${n})`
          out[n] = getComputedStyle(probe).color
        }
        probe.remove()
        return out
      }, [...new Set([...PAIRS, CHIP[scheme]].flat())])

      for (const [fg, bg] of [...PAIRS, CHIP[scheme]]) {
        const ratio = contrast(tokens[fg], tokens[bg])
        expect(
          ratio,
          `${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) in ${scheme}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      await ctx.close()
    })
  }
})
