import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

// Kept in step with src/lib/cv.ts. The page must not retype these.
const EMAIL = 'jeremie.nehlil.freelance@proton.me'
const LOCATION = 'Near Paris (Sorel-Moussel), France'
const EXTERNAL = [
  'https://www.malt.fr/profile/jeremienehlil',
  'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-n%C3%A9hlil-36932a41/',
  'https://github.com/jeremN',
]

test.describe('contact page', () => {
  test('offers a single primary action', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    // "Primary action" is a row in the routes list now, not a standalone
    // button, but the data-cta marker still picks out the one Email link.
    const cta = page.locator('[data-routes] a[data-cta]')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', `mailto:${EMAIL}`)
  })

  test('lists every contact route from the CV', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    for (const href of EXTERNAL) {
      await expect(page.locator(`[data-routes] a[href="${href}"]`)).toBeVisible()
    }
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
  })

  test('external links carry rel="noopener"', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const external = page.locator('[data-routes] a[target="_blank"]')
    const count = await external.count()
    expect(count).toBe(EXTERNAL.length)
    for (let i = 0; i < count; i++) {
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/)
    }
  })

  // The mailto link is the whole point; printing the address beside it added
  // nothing and put a harvestable string on the page. This is the single
  // most important test on this page: do not weaken it.
  test('links to the email without printing the address', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)).toBeVisible()
    await expect(page.locator('main')).not.toContainText('@proton.me')
  })

  test('hides the footer CTA, because the page is the CTA', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('footer a[href$="/contact"]')).toHaveCount(0)
  })

  test('shows the full location string from the CV, not a truncated version', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('main')).toContainText(LOCATION)
  })
})

test.describe('contact page channel and meta icons', () => {
  test('the Email, LinkedIn and GitHub rows each carry their own icon', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const mailRow = page.locator(`[data-routes] a[href="mailto:${EMAIL}"]`)
    await expect(mailRow.locator('[data-doodle="icon-mail"]')).toHaveCount(1)

    const linkedinRow = page.locator(`[data-routes] a[href="${EXTERNAL[1]}"]`)
    await expect(linkedinRow.locator('[data-doodle="icon-linkedin"]')).toHaveCount(1)

    const githubRow = page.locator(`[data-routes] a[href="${EXTERNAL[2]}"]`)
    await expect(githubRow.locator('[data-doodle="icon-github"]')).toHaveCount(1)
  })

  // Task 1's Pencil generation failed 4 times for icon-malt: a disclosed,
  // pre-approved gap. The Malt row renders text-only by design, not as a
  // broken image reference, so this asserts the absence gracefully.
  test('the Malt row has no icon, since icon-malt was never generated', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const maltRow = page.locator(`[data-routes] a[href="${EXTERNAL[0]}"]`)
    await expect(maltRow).toBeVisible()
    await expect(maltRow.locator('[data-doodle]')).toHaveCount(0)
  })

  test('the Based In and Working meta rows each carry their own icon', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.locator('[data-doodle="icon-map-pin"]')).toHaveCount(1)
    await expect(page.locator('[data-doodle="icon-radar"]')).toHaveCount(1)
  })
})

test.describe('contact page current availability block', () => {
  test('shows on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/contact`)
    await expect(page.getByText('CURRENT AVAILABILITY')).toBeVisible()
  })

  test('is hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/contact`)
    await expect(page.getByText('CURRENT AVAILABILITY')).toBeHidden()
  })
})

test.describe('contact page illustration', () => {
  test('renders once for desktop and once for mobile, both decorative', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const marks = page.locator('[data-doodle="xiaohei-contact-signal"]')
    await expect(marks).toHaveCount(2)
    for (const instance of await marks.all()) {
      await expect(instance).toHaveAttribute('aria-hidden', 'true')
    }
  })

  test('the desktop instance and the mobile instance swap on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/contact`)
    const marks = page.locator('[data-doodle="xiaohei-contact-signal"]')
    // Source order: the desktop instance (hidden below lg) comes first, then
    // the mobile full-bleed crop (hidden at lg and up).
    await expect(marks.nth(0)).toBeVisible()
    await expect(marks.nth(1)).toBeHidden()

    await page.setViewportSize({ width: 390, height: 800 })
    await expect(marks.nth(0)).toBeHidden()
    await expect(marks.nth(1)).toBeVisible()
  })

  test('the desktop instance sits beside the title column, not above or below it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/contact`)
    const title = page.locator('h1')
    const desktopMark = page.locator('[data-doodle="xiaohei-contact-signal"]').first()
    await expect(desktopMark).toBeVisible()

    // Same bounding-box technique as e2e/article.spec.ts and e2e/about.spec.ts's
    // own desktop-beside-title checks, reused for this page's hero mechanism.
    const [titleBox, markBox] = await Promise.all([title.boundingBox(), desktopMark.boundingBox()])
    if (!titleBox || !markBox) throw new Error('no box')

    expect(markBox.x).toBeGreaterThan(titleBox.x + titleBox.width)
    const overlap = Math.min(titleBox.y + titleBox.height, markBox.y + markBox.height) - Math.max(titleBox.y, markBox.y)
    expect(overlap).toBeGreaterThan(0)
  })

  test('the mobile instance sits below the hero text as its own bled-edge block', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(`${BASE}/contact`)
    const intro = page.locator('main p').first()
    const mobileMark = page.locator('[data-doodle="xiaohei-contact-signal"]').nth(1)
    await expect(mobileMark).toBeVisible()

    const [introBox, markBox] = await Promise.all([intro.boundingBox(), mobileMark.boundingBox()])
    if (!introBox || !markBox) throw new Error('no box')
    expect(markBox.y).toBeGreaterThanOrEqual(introBox.y + introBox.height)
  })

  test('the illustration is present in both light and dark theme without erroring', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`${BASE}/contact`)
    const marks = page.locator('[data-doodle="xiaohei-contact-signal"]')

    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
    await expect(marks).toHaveCount(2)

    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
    await expect(marks).toHaveCount(2)

    expect(errors).toEqual([])
  })
})
