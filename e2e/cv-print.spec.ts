import { test, expect } from '@playwright/test'
import { BASE } from '../site.config.mjs'
import { getExperiences } from '../src/lib/cv'
import { getCopy, type Locale } from '../src/i18n'

// /cv retired in favour of /about (which now carries the CV's intro,
// download link, and location/languages line). The cv-print pages are the only
// remaining consumers of the full experience/mission/employer breakdown: they
// are the source the two PDFs render from, so this is the coverage that used to
// live on /cv itself.
const SHEETS: { lang: Locale; route: string; pdf: string }[] = [
  { lang: 'en', route: '/cv-print', pdf: '/cv.pdf' },
  { lang: 'fr', route: '/fr/cv-print', pdf: '/cv-fr.pdf' },
]

for (const { lang, route, pdf } of SHEETS) {
  test.describe(`${route}`, () => {
    const experiences = getExperiences(lang)
    const missionCount = experiences.reduce((n, e) => n + (e.missions?.length ?? 0), 0)

    test('renders every experience and mission for the PDF source', async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      await expect(page.locator('[data-experience]')).toHaveCount(experiences.length)
      await expect(page.locator('[data-mission]')).toHaveCount(missionCount)
    })

    test('shows the agency employers and their nested client missions', async ({ page }) => {
      await page.goto(`${BASE}${route}`)
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
    test('keeps the contact line', async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1)
    })

    test('is marked noindex', async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    })

    test('its PDF is downloadable', async ({ request }) => {
      const res = await request.get(`${BASE}${pdf}`)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('pdf')
      expect(Number(res.headers()['content-length'])).toBeGreaterThan(15000)
    })
  })
}

// `npm run cv:pdf` renders two pages into two files. A wrong URL in that script
// writes the same sheet twice, and both PDFs still download, still say `pdf`,
// and still clear the size floor. Only comparing them catches it.
test('the two PDFs are two different documents', async ({ request }) => {
  const [en, fr] = await Promise.all(SHEETS.map((s) => request.get(`${BASE}${s.pdf}`)))
  expect(en.status()).toBe(200)
  expect(fr.status()).toBe(200)
  expect(Buffer.from(await fr.body()).equals(Buffer.from(await en.body()))).toBe(false)
})

test('neither sheet reaches the sitemap', async ({ request }) => {
  const res = await request.get('/sitemap-0.xml')
  expect(res.status()).toBe(200)
  const xml = await res.text()
  for (const { route } of SHEETS) expect(xml, route).not.toContain(route)
})

// The whole point of a second sheet is that a recruiter reading French gets a
// CV in French. Two ways that breaks: a wrapper passes the wrong language, or a
// heading was left hardcoded in the shared component when it was extracted.
// Both show up as English words on the French sheet, so the assertion is that
// each sheet carries its own headings and none of the other's.
test.describe('the two sheets are in two languages', () => {
  const HEADINGS = ['experience', 'education', 'links', 'certs'] as const

  for (const { lang, route } of SHEETS) {
    const other: Locale = lang === 'en' ? 'fr' : 'en'
    test(`${route} prints its headings in ${lang}`, async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      const sheet = page.locator('.sheet')
      for (const key of HEADINGS) {
        const mine = getCopy(lang, 'cv')[key]
        const theirs = getCopy(other, 'cv')[key]
        await expect(sheet, `${route} is missing ${mine}`).toContainText(mine)
        // Only assert the absence where the two languages actually differ:
        // `Stack` is the same word in both, and so is `Freelance`.
        if (mine !== theirs) {
          await expect(sheet, `${route} still prints the ${other} heading ${theirs}`).not.toContainText(theirs)
        }
      }
    })

    test(`${route} prints every blurb in ${lang}`, async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      const sheet = page.locator('.sheet')
      const blurbs = getExperiences(lang).flatMap((e) => [e.blurb, ...(e.missions ?? []).map((m) => m.blurb)])
      expect(blurbs.length, 'the blurb sweep found nothing to sweep').toBeGreaterThan(0)
      for (const blurb of blurbs) await expect(sheet, route).toContainText(blurb)
    })
  }
})
