import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('about page', () => {
  test('leads with the editorial title and its underline', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('h1')).toContainText('I like software that makes sense')
    await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
  })

  test('numbers the four principle rows in document order, from the real array', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const items = page.locator('[data-principle]')
    await expect(items).toHaveCount(4)

    // Titles pulled straight from about.astro's own `principles` array (in its
    // authored order), not copied here from the brief. A reorder there is
    // what this assertion would catch.
    await expect(items).toHaveText([/Simple systems/, /Maintainable code/, /Useful software/, /Continuous learning/])

    // getComputedStyle does not resolve counter() -- it returns the specified
    // value, not the rendered digits -- same limitation e2e/article.spec.ts
    // notes for the article section ordinals. So the rendered "01".."04" text
    // is not directly observable here. Assert the wiring instead: one
    // counter-reset on the list, one counter-increment per row, and every
    // row's ordinal drawing from that same counter. Combined with the
    // document order asserted above, this guarantees row 1 shows 01 beside
    // "Simple systems", row 2 shows 02 beside "Maintainable code", and so on
    // -- the ordinal cannot drift from its title.
    const reset = await page.locator('[data-principles]').evaluate((el) => getComputedStyle(el).counterReset)
    expect(reset).toContain('principle')

    for (const item of await items.all()) {
      const wiring = await item.evaluate((el) => ({
        increment: getComputedStyle(el).counterIncrement,
        content: getComputedStyle(el, '::before').content,
      }))
      expect(wiring.increment).toContain('principle')
      expect(wiring.content).toContain('counter(principle')
    }
  })

  test('the tools list comes from the CV, so the two cannot contradict', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const tools = page.locator('[data-tools]')
    await expect(tools).toContainText('SvelteKit')
    await expect(tools).toContainText('Playwright')
  })
})

// The standalone /cv page retired in favour of this page: its intro, download
// link, and location/languages line moved here rather than duplicating both
// pages' pitches. See e2e/cv-print.spec.ts for the detailed job-history
// coverage, which now lives only in the downloadable PDF.
test.describe('about page, absorbing the CV intro', () => {
  test('leads with the CV lead paragraph, not a shorter duplicate', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('main')).toContainText('Frontends in SvelteKit, Next.js, React and TanStack Start')
  })

  test('links to the downloadable PDF', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.getByRole('link', { name: /Download CV/ })).toHaveAttribute('href', `${BASE}/cv.pdf`)
  })

  test('shows the location and languages line', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('main')).toContainText('Near Paris (Sorel-Moussel), France')
    await expect(page.locator('main')).toContainText('French (native), English (professional)')
  })

  // Same rule the old standalone /cv page followed: a page a recruiter may
  // share is the wrong place to publish the address. Email lives on /contact
  // and /freelance only.
  test('publishes no email address', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText('@proton.me')
  })
})

test.describe('about page illustration', () => {
  test('renders once for desktop and once for mobile, both decorative', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const marks = page.locator('[data-doodle="xiaohei-about-hero"]')
    await expect(marks).toHaveCount(2)
    for (const instance of await marks.all()) {
      await expect(instance).toHaveAttribute('aria-hidden', 'true')
    }
  })

  test('the desktop instance and the mobile instance swap on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/about`)
    const marks = page.locator('[data-doodle="xiaohei-about-hero"]')
    // Source order: the desktop instance (hidden below lg) comes first, then
    // the mobile full-width block (hidden at lg and up).
    await expect(marks.nth(0)).toBeVisible()
    await expect(marks.nth(1)).toBeHidden()

    await page.setViewportSize({ width: 390, height: 800 })
    await expect(marks.nth(0)).toBeHidden()
    await expect(marks.nth(1)).toBeVisible()
  })

  test('the desktop instance sits beside the title column, not above or below it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/about`)
    const title = page.locator('h1')
    const desktopMark = page.locator('[data-doodle="xiaohei-about-hero"]').first()
    await expect(desktopMark).toBeVisible()

    // Same bounding-box technique as e2e/article.spec.ts's own
    // desktop-beside-title check, reused for this page's hero mechanism.
    const [titleBox, markBox] = await Promise.all([title.boundingBox(), desktopMark.boundingBox()])
    if (!titleBox || !markBox) throw new Error('no box')

    expect(markBox.x).toBeGreaterThan(titleBox.x + titleBox.width)
    const overlap = Math.min(titleBox.y + titleBox.height, markBox.y + markBox.height) - Math.max(titleBox.y, markBox.y)
    expect(overlap).toBeGreaterThan(0)
  })

  test('the mobile instance sits below the hero text as its own block, not beside it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/about`)
    // Spec decision 6: unlike Article, whose mobile mark is a cropped
    // viewport inside the same hero cluster, the comp's own mobile document
    // order puts this illustration as a full-width block after the hero
    // text (kicker + title + intro), not beside it. The intro paragraph is
    // the only <p> on the page above the illustration.
    const intro = page.locator('main p').first()
    const mobileMark = page.locator('[data-doodle="xiaohei-about-hero"]').nth(1)
    await expect(mobileMark).toBeVisible()

    const [introBox, markBox] = await Promise.all([intro.boundingBox(), mobileMark.boundingBox()])
    if (!introBox || !markBox) throw new Error('no box')
    expect(markBox.y).toBeGreaterThanOrEqual(introBox.y + introBox.height)
  })

  test('the illustration is present in both light and dark theme without erroring', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`${BASE}/about`)
    const marks = page.locator('[data-doodle="xiaohei-about-hero"]')

    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
    await expect(marks).toHaveCount(2)

    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
    await expect(marks).toHaveCount(2)

    expect(errors).toEqual([])
  })

  // Spec decision 7c: this is the first Xiaohei page to need a fourth colour
  // rule. The mascot's eyes, mouth and the watering can's spout highlight are
  // background cutouts -- they show the page's own ground colour through the
  // mascot's solid silhouette, not a paper/card surface fill (the existing
  // --color-surface case every prior page already covers). Re-derived
  // straight from the live xiaohei-about-hero.svg file: 3
  // `fill="var(--color-ground)"` shapes (the two eyes and the mouth) plus 2
  // `stroke="var(--color-ground)"` shapes (the mouth's lower line and the
  // spout highlight).
  test('the eyes, mouth and spout highlight cut through to the page ground colour in both themes', async ({
    page,
  }) => {
    await page.goto(`${BASE}/about`)
    const mark = page.locator('[data-doodle="xiaohei-about-hero"]').first()

    const readCutouts = () =>
      mark.evaluate((el) => {
        // Probed with a span, not read off the custom property directly: a
        // custom property's own getPropertyValue returns the literal
        // "light-dark(...)" string in both themes, since light-dark() only
        // resolves when the token is used in an actual colour context.
        const probe = document.createElement('span')
        probe.style.position = 'absolute'
        probe.style.opacity = '0'
        document.body.appendChild(probe)
        const tokenColour = (token: string) => {
          probe.style.color = `var(${token})`
          return getComputedStyle(probe).color
        }
        const ground = tokenColour('--color-ground')
        const surface = tokenColour('--color-surface')
        probe.remove()

        const fills = [...el.querySelectorAll('[fill="var(--color-ground)"]')].map(
          (shape) => getComputedStyle(shape).fill,
        )
        const strokes = [...el.querySelectorAll('[stroke="var(--color-ground)"]')].map(
          (shape) => getComputedStyle(shape).stroke,
        )
        const body = el.querySelector('[fill="currentColor"]')
        return { fills, strokes, body: body ? getComputedStyle(body).fill : null, ground, surface }
      })

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme)
      const { fills, strokes, body, ground, surface } = await readCutouts()

      expect(fills.length, `${theme}: fill cutouts found`).toBeGreaterThan(0)
      expect(strokes.length, `${theme}: stroke cutouts found`).toBeGreaterThan(0)
      for (const fill of fills) expect(fill, `${theme}: cutout fill`).toBe(ground)
      for (const stroke of strokes) expect(stroke, `${theme}: cutout stroke`).toBe(ground)

      // Not the already-established --color-surface case: close, but not
      // byte-exact, per decision 7c.
      expect(ground, `${theme}: ground token vs surface token`).not.toBe(surface)

      // And the cutout must actually read as a cutout: distinct from the
      // mascot's own silhouette colour in both themes, including dark mode
      // where the body flips to near-white and the cutout must flip with it.
      expect(body, `${theme}: mascot body colour resolved`).not.toBeNull()
      expect(ground, `${theme}: cutout vs mascot body`).not.toBe(body)
    }
  })

  // The colour-token test above only checks that the cutout shapes carry the
  // right fill/stroke *value* -- it says nothing about where those shapes
  // actually sit. A uniform per-shape scale bug once shipped (fixed in this
  // same commit) that left every shape's origin correct but its extent
  // shrunk to ~59% of true size, which pushed a cutout entirely off the
  // mascot's silhouette while the colour check kept passing. Guard the
  // geometry itself: sample each cutout shape's bounding box on a 3x3 grid,
  // map every sample point into the body path's own coordinate space via
  // getScreenCTM (so this holds regardless of the SVG's viewBox, the g
  // transforms baked in at extraction time, or the doodle wrapper's CSS
  // size), and require most samples to land inside the body's fill via
  // isPointInFill. A cutout that has drifted outside the silhouette --
  // whole or in large part -- fails this before it ever reaches a screen.
  test('the eyes, mouth and spout highlight sit inside the mascot silhouette, in both themes', async ({ page }) => {
    await page.goto(`${BASE}/about`)
    const mark = page.locator('[data-doodle="xiaohei-about-hero"]').first()

    const readContainment = () =>
      mark.evaluate((el) => {
        const svg = el.querySelector('svg')
        if (!svg) throw new Error('no svg')
        const body = svg.querySelector('[fill="currentColor"]')
        if (!(body instanceof SVGGeometryElement)) throw new Error('no body path')
        const cutouts = [
          ...svg.querySelectorAll('[fill="var(--color-ground)"], [stroke="var(--color-ground)"]'),
        ].filter((n): n is SVGGraphicsElement => n instanceof SVGGraphicsElement)

        const sampleGrid = (shape: SVGGraphicsElement, n = 3) => {
          const b = shape.getBBox()
          const points: DOMPointInit[] = []
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              points.push({ x: b.x + (b.width * (i + 0.5)) / n, y: b.y + (b.height * (j + 0.5)) / n })
            }
          }
          return points
        }
        const toScreen = (shape: SVGGraphicsElement, local: DOMPointInit) => {
          const ctm = shape.getScreenCTM()
          if (!ctm) throw new Error('no screen CTM')
          return new DOMPoint(local.x, local.y).matrixTransform(ctm)
        }
        const toLocal = (shape: SVGGraphicsElement, screen: DOMPoint) => {
          const ctm = shape.getScreenCTM()
          if (!ctm) throw new Error('no screen CTM')
          return new DOMPoint(screen.x, screen.y).matrixTransform(ctm.inverse())
        }

        return cutouts.map((cutout) => {
          const samples = sampleGrid(cutout)
          const inside = samples.map((p) => body.isPointInFill(toLocal(body, toScreen(cutout, p))))
          return inside.filter(Boolean).length / inside.length
        })
      })

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme)
      const ratios = await readContainment()

      expect(ratios.length, `${theme}: cutout shapes found`).toBeGreaterThan(0)
      for (const ratio of ratios) {
        expect(ratio, `${theme}: cutout mostly inside the mascot silhouette`).toBeGreaterThan(0.4)
      }
    }
  })
})
