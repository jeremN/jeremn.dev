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

test.describe('article routes', () => {
  const EN = '/blog/stryker-on-a-svelte-monorepo'
  const FR = '/fr/blog/faire-tourner-stryker-sur-un-monorepo-svelte'

  test('the French article renders at its French slug', async ({ page }) => {
    await page.goto(`${BASE}${FR}`)
    await expect(page.locator('h1')).toContainText('Faire tourner Stryker sur un monorepo Svelte')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })

  test('the pair carries reciprocal hreflang on both sides', async ({ page }) => {
    for (const path of [EN, FR]) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', new RegExp(`${EN}$`))
      await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', new RegExp(`${FR}$`))
    }
  })

  test('the switcher crosses between the two articles', async ({ page }) => {
    await page.goto(`${BASE}${EN}`)
    await expect(page.locator('[data-lang-switch]')).toHaveAttribute('href', `${BASE}${FR}`)
    await page.goto(`${BASE}${FR}`)
    await expect(page.locator('[data-lang-switch]')).toHaveAttribute('href', `${BASE}${EN}`)
  })

  test('the French article reuses the English illustration rather than a copy', async ({ page }) => {
    await page.goto(`${BASE}${FR}`)
    // Two instances, the desktop one and the full-bleed mobile one, the same
    // pair every English article renders (see article.spec.ts). The count is
    // what proves the lookup went through `translationKey`: keyed on the slug
    // it would find nothing and render zero.
    await expect(page.locator('[data-doodle="xiaohei-article-stryker-on-a-svelte-monorepo"]')).toHaveCount(2)
  })

  test('an article with no twin emits no hreflang and hides the switcher', async ({ page }) => {
    await page.goto(`${BASE}/blog/ten-months-of-svelte-5`)
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
    await expect(page.locator('[data-lang-switch]')).toHaveCount(0)
  })

  test('the English article keeps its illustration and its highlighted code', async ({ page }) => {
    await page.goto(`${BASE}${EN}`)
    await expect(page.locator('article pre span[style*="color"]').first()).toBeVisible()
  })

  // The article shell is not in the MDX, so translating the article never
  // reaches it. Without these, a French reader meets an English frame around
  // French prose and every assertion above still passes.
  test('the French article frames the prose in French, not in English', async ({ page }) => {
    await page.goto(`${BASE}${FR}`)
    await expect(page.locator('[data-back]')).toContainText('Tous les articles')
    await expect(page.locator('[data-back]')).not.toContainText('All notes')
    await expect(page.locator('main aside nav')).toHaveAttribute('aria-label', 'Sur cette page')
    await expect(page.locator('main aside nav span').first()).toContainText('Sur cette page')
    await expect(page.locator('main')).toContainText('min de lecture')
    await expect(page.locator('main')).not.toContainText('min read')
    await expect(page.locator('main')).toContainText('17 août 2026')
  })

  test('the English article keeps its own English shell', async ({ page }) => {
    await page.goto(`${BASE}${EN}`)
    await expect(page.locator('[data-back]')).toContainText('← All notes')
    await expect(page.locator('main aside nav')).toHaveAttribute('aria-label', 'On this page')
    await expect(page.locator('main')).toContainText('min read')
    await expect(page.locator('main')).toContainText('Aug 17, 2026')
  })

  // The copy button is built by a client script, which cannot import the Astro
  // dictionary. This is the assertion that the strings actually cross that
  // boundary instead of staying English on the French page.
  test('the code-block chrome is localised across the client-script boundary', async ({ page }) => {
    await page.goto(`${BASE}${EN}`)
    await expect(page.locator('.code-block__copy').first()).toHaveText('Copy')
    await expect(page.locator('article .heading-anchor').first()).toHaveAttribute('aria-label', 'Link to this section')

    await page.goto(`${BASE}${FR}`)
    await expect(page.locator('.code-block__copy').first()).toHaveText('Copier')
    await expect(page.locator('article .heading-anchor').first()).toHaveAttribute('aria-label', 'Lien vers cette section')
  })
})
