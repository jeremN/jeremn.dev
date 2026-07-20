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

test('cv exposes a contact email', async ({ page }) => {
  await page.goto(`${BASE}/cv`)
  await expect(
    page.getByRole('link', { name: 'jeremie.nehlil.freelance@proton.me' }),
  ).toHaveAttribute('href', 'mailto:jeremie.nehlil.freelance@proton.me')
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
