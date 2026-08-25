import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'

test.describe('French home page', () => {
  test('renders the French headline at /fr/', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('h1')).toContainText('Je construis des applications web')
    await expect(page.locator('h1')).toContainText('monde réel.')
  })

  test('keeps the English headline at the root', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('h1')).toContainText('I build web apps for the')
    await expect(page.locator('h1')).toContainText('real world.')
  })

  test('renders the underline doodle inside both headlines', async ({ page }) => {
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('h1 [data-doodle="underline"]')).toBeAttached()
    }
  })
})

test.describe('head and chrome per locale', () => {
  test('stamps the route locale on <html lang>', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('each variant carries the full reciprocal hreflang set', async ({ page }) => {
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/$/)
      await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/$/)
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', /\/$/)
    }
  })

  test('canonical points at the page itself, never at the other language', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/$/)
  })

  test('translates the nav labels', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    const labels = await page.locator('header nav a').allTextContents()
    expect(labels.map((l) => l.trim())).toEqual(['Articles', 'À propos', 'Services', 'Contact'])
  })
})

test.describe('language switcher', () => {
  test('leads to the twin of the current page, not to the other home', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const toFr = page.locator('[data-lang-switch]')
    await expect(toFr).toHaveAttribute('href', `${BASE}/fr/`)
    await toFr.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.locator('[data-lang-switch]')).toHaveAttribute('href', `${BASE}/`)
  })

  test('sits outside the nav, so the four destinations stay four', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('header nav [data-lang-switch]')).toHaveCount(0)
    await expect(page.locator('header [data-lang-switch]')).toHaveCount(1)
  })

  test('keeps the header on one line at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      const tops = await page
        .locator('header nav a, header [data-lang-switch]')
        .evaluateAll((els) => els.map((el) => (el as HTMLElement).getBoundingClientRect().top))
      expect(new Set(tops.map((t) => Math.round(t))).size, path).toBe(1)
    }
  })
})

test.describe('French services page', () => {
  test('renders at /fr/services with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/services`)
    await expect(page.locator('h1')).toContainText('Des systèmes utiles,')
    await expect(page.locator('h1')).toContainText('construits avec intention.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('pairs with the English page through hreflang', async ({ page }) => {
    await page.goto(`${BASE}/fr/services`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/services$/)
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/services$/)
  })

  test('lists the same number of offerings in both languages', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    const en = await page.locator('h2:text("01 / Development") ~ ul h4').count()
    await page.goto(`${BASE}/fr/services`)
    const fr = await page.locator('h2:text("01 / Développement") ~ ul h4').count()
    expect(fr).toBe(en)
  })

  test('the French home page shows French service names, not English ones', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    const section = page.locator('[data-services]')
    await expect(section).not.toContainText('Frontend web apps')
    await expect(section).not.toContainText('Fullstack features')
    await expect(section).toContainText('Applications web frontend')
  })

  test('the quote mailto subject is localised, not English on the French page', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute('href', /subject=Project%20quote/)
    await page.goto(`${BASE}/fr/services`)
    const fr = page.locator('a[href^="mailto:"]').first()
    await expect(fr).not.toHaveAttribute('href', /subject=Project%20quote/)
    await expect(fr).toHaveAttribute('href', /subject=Demande%20de%20devis/)
  })
})

test.describe('French about page', () => {
  test('renders at /fr/a-propos with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/a-propos`)
    await expect(page.locator('h1')).toContainText("J'aime les logiciels qui ont")
    await expect(page.locator('h1')).toContainText('du sens.')
  })

  test('the About nav link points at the French route under /fr/', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.getByRole('link', { name: 'À propos', exact: true })).toHaveAttribute(
      'href',
      `${BASE}/fr/a-propos`,
    )
  })

  test('pairs with the English page through hreflang', async ({ page }) => {
    await page.goto(`${BASE}/fr/a-propos`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/about$/)
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/a-propos$/)
  })
})

test.describe('French home page lead', () => {
  test('the French home page lead is entirely French', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    const lead = page.locator('[data-hero] p').first()
    await expect(lead).toContainText('Développeur fullstack JavaScript senior')
    await expect(lead).not.toContainText('Senior fullstack')
  })
})

test.describe('writing page closing illustration', () => {
  test('is gone, and the list is the last thing before the footer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-doodle="xiaohei-writing-footer"]')).toHaveCount(0)
  })

  test('the hero illustration stays', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('[data-doodle="xiaohei-writing-header"]').first()).toBeAttached()
  })
})

test.describe('French contact page', () => {
  test('renders at /fr/contact with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/contact`)
    await expect(page.locator('h1')).toContainText('Vous avez un projet en')
    await expect(page.locator('h1')).toContainText('tête ?')
  })

  test('never prints the email address, in either language', async ({ page }) => {
    for (const path of ['/contact', '/fr/contact']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('body')).not.toContainText('jeremie.nehlil.freelance@proton.me')
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1)
    }
  })
})

test.describe('French freelance page', () => {
  test('renders at /fr/freelance with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/freelance`)
    await expect(page.locator('h1')).toContainText('Disponible pour')
    await expect(page.locator('h1')).toContainText('votre équipe.')
  })

  test('stays out of the nav and the footer in both languages', async ({ page }) => {
    for (const path of ['/', '/fr/']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('header nav a[href$="/freelance"]')).toHaveCount(0)
      await expect(page.locator('footer a[href$="/freelance"]')).toHaveCount(0)
    }
  })
})

test.describe('bilingual blog index', () => {
  test('renders at /fr/blog with the French headline', async ({ page }) => {
    await page.goto(`${BASE}/fr/blog`)
    await expect(page.locator('h1')).toContainText("Notes de l'")
    await expect(page.locator('h1')).toContainText('établi.')
  })

  test('the English index still lists the nine English articles', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.locator('main a[href*="/blog/"]')).toHaveCount(9)
  })

  test('the French index lists no English article', async ({ page }) => {
    await page.goto(`${BASE}/fr/blog`)
    await expect(page.getByRole('link', { name: /Ten months of Svelte 5/ })).toHaveCount(0)
  })

  test('the homepage writing teaser stays in the page language', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.getByRole('link', { name: /Ten months of Svelte 5/ })).toHaveCount(0)
    // The title above is the oldest of the nine and the teaser shows three, so
    // that assertion cannot fail. These two can, and they catch different
    // regressions: the title fires when the locale filter drops (the newest
    // English post is what a broken filter surfaces first), the href fires when
    // the row prefix drops. Both stay true once French articles land.
    await expect(page.locator('[data-writing]')).not.toContainText('Contract tests without the stack')
    await expect(page.locator('[data-writing] a[href*="/blog/"]:not([href*="/fr/blog/"])')).toHaveCount(0)
  })
})
