import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const EMAIL = 'jeremie.nehlil.freelance@proton.me'

test.describe('services page', () => {
  test('leads with the editorial title and its underline', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await expect(page.locator('h1')).toContainText('Useful systems,')
    await expect(page.locator('h1')).toContainText('built with intent.')
    await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
  })

  test('renders the hero mark once for desktop and once for mobile, both decorative', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const desktop = page.locator('[data-doodle="xiaohei-services-hero"]')
    const mobile = page.locator('[data-doodle="xiaohei-services-hero-mobile"]')
    await expect(desktop).toHaveCount(1)
    await expect(mobile).toHaveCount(1)
    await expect(desktop).toHaveAttribute('aria-hidden', 'true')
    await expect(mobile).toHaveAttribute('aria-hidden', 'true')
  })

  test('lists all six development offerings', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const titles = await page.locator('h2:text("01 / Development") ~ ul h4').allTextContents()
    expect(titles).toEqual([
      'Full-stack development',
      'Frontend development',
      'Backend & APIs',
      'Performance & audits',
      'Automation & tooling',
      'AI integration',
    ])
  })

  test('lists all three AI & automation offerings, each with an icon', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const items = page.locator('section:has(h2:text("02 / AI & automation")) ul li')
    await expect(items).toHaveCount(3)
    await expect(items.nth(0).locator('[data-doodle="svc-icon-agent-setup"]')).toBeAttached()
    await expect(items.nth(0)).toContainText('Agent setup')
    await expect(items.nth(2).locator('[data-doodle="svc-icon-ai-tool-integration"]')).toBeAttached()
    await expect(items.nth(2)).toContainText('AI tool integration')
  })

  test('gives each development offering its own icon', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const marks = page.locator('h2:text("01 / Development") ~ ul [data-doodle]')
    await expect(marks).toHaveCount(6)
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute('aria-hidden', 'true')
    }
  })

  test('the quote CTA is a mailto link and never prints the raw address', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const cta = page.locator('[data-quote-cta]')
    await expect(cta).toHaveCount(1)
    await expect(cta).toHaveAttribute('href', `mailto:${EMAIL}?subject=Project%20quote`)
    await expect(page.locator('main')).not.toContainText('@proton.me')
  })

  test('is reachable from the main nav and marked active', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const link = page.locator('nav[aria-label="Main"] a', { hasText: 'Services' })
    await expect(link).toHaveAttribute('aria-current', 'page')
  })

  test('hides the footer CTA, because the page is its own CTA', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await expect(page.locator('footer a:has(h2)')).toHaveCount(0)
  })
})
