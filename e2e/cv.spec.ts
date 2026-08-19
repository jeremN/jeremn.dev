import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'
import { experiences } from '../src/lib/cv'

const missionCount = experiences.reduce((n, e) => n + (e.missions?.length ?? 0), 0)

test('cv lists every experience and mission with no silent drop', async ({ page }) => {
  await page.goto(`${BASE}/cv`)
  await expect(page.locator('[data-experience]')).toHaveCount(experiences.length)
  await expect(page.locator('[data-mission]')).toHaveCount(missionCount)
})

test('cv shows the agency employers and their nested client missions', async ({ page }) => {
  await page.goto(`${BASE}/cv`)
  await expect(page.getByRole('heading', { name: 'Fidesio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Liamone Web' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'France Télévisions' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Groupe PSA / Citroën' })).toBeVisible()
})

// Removed on purpose. The address lives on /contact and /freelance; the web CV
// is the wrong place to publish it. Asserted as an absence so it cannot creep
// back in unnoticed.
test('cv publishes no email address', async ({ page }) => {
  await page.goto(`${BASE}/cv`)
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0)
  await expect(page.locator('main')).not.toContainText('@proton.me')
})

// The PDF still carries it: a CV handed to a recruiter needs a way to answer.
test('the PDF source keeps the contact line', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1)
})

test('cv-print renders every experience for the PDF source', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  await expect(page.locator('[data-experience]')).toHaveCount(experiences.length)
  await expect(page.locator('[data-mission]')).toHaveCount(missionCount)
})

test('cv-print is marked noindex', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('cv-print stays out of the sitemap', async ({ request }) => {
  const res = await request.get('/sitemap-0.xml')
  expect(res.status()).toBe(200)
  expect(await res.text()).not.toContain('cv-print')
})

test('the CV PDF is downloadable', async ({ request }) => {
  const res = await request.get(`${BASE}/cv.pdf`)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('pdf')
  expect(Number(res.headers()['content-length'])).toBeGreaterThan(15000)
})

test('cv page links to the downloadable PDF', async ({ page }) => {
  await page.goto(`${BASE}/cv`)
  await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('href', `${BASE}/cv.pdf`)
})
