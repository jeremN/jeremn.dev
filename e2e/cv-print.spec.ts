import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'
import { experiences } from '../src/lib/cv'

const missionCount = experiences.reduce((n, e) => n + (e.missions?.length ?? 0), 0)

// /cv retired in favour of /about (which now carries the CV's intro,
// download link, and location/languages line). cv-print is the only
// remaining consumer of the full experience/mission/employer breakdown: it
// is the source the PDF renders from, so this is the coverage that used to
// live on /cv itself.
test('cv-print renders every experience and mission for the PDF source', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  await expect(page.locator('[data-experience]')).toHaveCount(experiences.length)
  await expect(page.locator('[data-mission]')).toHaveCount(missionCount)
})

test('cv-print shows the agency employers and their nested client missions', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  // Company and client names print as `.company`/`.client`, not a heading
  // role -- the PDF sheet uses plain <p> tags for its type hierarchy, not
  // semantic headings. Employers are `.company`; a mission's client nested
  // under one is `.client`.
  await expect(page.locator('.company', { hasText: 'Fidesio' })).toBeVisible()
  await expect(page.locator('.company', { hasText: 'Liamone Web' })).toBeVisible()
  await expect(page.locator('.client', { hasText: 'France Télévisions' })).toBeVisible()
  await expect(page.locator('.client', { hasText: 'Groupe PSA / Citroën' })).toBeVisible()
})

// The PDF carries the email: a CV handed to a recruiter needs a way to answer.
test('the PDF source keeps the contact line', async ({ page }) => {
  await page.goto(`${BASE}/cv-print`)
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1)
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
