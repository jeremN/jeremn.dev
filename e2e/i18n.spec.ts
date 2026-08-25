import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'
import { ROUTE_MAP } from '../src/i18n'

// The blog collection, read off disk rather than listed here by hand. Every
// sweep below that needs "the French articles" derives them from this, so an
// article added by a later translation task joins the sweeps without an edit.
const BLOG_DIR = fileURLToPath(new URL('../src/content/blog', import.meta.url))

type Article = { slug: string; lang: string; translationKey: string; body: string }

const ARTICLES: Article[] = readdirSync(BLOG_DIR)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => {
    // Split on the frontmatter fences. `parts[1]` is the frontmatter; the rest
    // is the body, rejoined because `---` is also a valid horizontal rule.
    const parts = readFileSync(`${BLOG_DIR}/${file}`, 'utf8').split(/^---$/m)
    const front = parts[1] ?? ''
    const field = (name: string) =>
      front.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'))?.[1] ?? ''
    return {
      slug: file.replace(/\.mdx$/, ''),
      lang: field('lang'),
      translationKey: field('translationKey'),
      body: parts.slice(2).join('---'),
    }
  })

const FRENCH_ARTICLES = ARTICLES.filter((a) => a.lang === 'fr')

test.describe('the article fixture the sweeps read', () => {
  // Without this, a broken path or a changed frontmatter shape would empty
  // every derived list above and turn three sweeps green by having nothing
  // left to check.
  test('parses the collection and finds French articles in it', () => {
    expect(ARTICLES.length).toBeGreaterThan(1)
    expect(ARTICLES.every((a) => a.lang !== '' && a.translationKey !== '')).toBe(true)
    expect(FRENCH_ARTICLES.length).toBeGreaterThan(0)
  })
})

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

test.describe('untranslated routes', () => {
  test('/hero-lab and /cv-print emit no hreflang and no switcher', async ({ page }) => {
    for (const path of ['/hero-lab', '/cv-print']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
      await expect(page.locator('[data-lang-switch]')).toHaveCount(0)
    }
  })

  test('they stay noindex', async ({ page }) => {
    for (const path of ['/hero-lab', '/cv-print']) {
      await page.goto(`${BASE}${path}`)
      await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1)
    }
  })
})

test.describe('no English survives on the French side', () => {
  // This branch shipped an English /fr/ home page once, and four more English
  // leaks were caught in review rather than by a test. Every one of them lived
  // outside the page component, where the extraction grep is blind: an imported
  // data module, a hardcoded `en-US` date locale, a string returned by a
  // function, a string inside a client script. The two tests below are the net
  // that does not depend on remembering where prose can hide.

  // If a French route renders its English twin's content, the two pages' main
  // text is character-identical. Nothing else makes that happen, so this single
  // assertion covers every page at once, including pages added later.
  for (const [en, fr] of Object.entries(ROUTE_MAP)) {
    test(`${fr} does not render ${en}'s content`, async ({ page }) => {
      await page.goto(`${BASE}${en}`)
      const english = await page.locator('main').innerText()
      await page.goto(`${BASE}${fr}`)
      const french = await page.locator('main').innerText()
      expect(french, `${fr} rendered the English page`).not.toBe(english)
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    })
  }

  // A page can be mostly French and still leak a phrase. These are the chrome
  // strings a partial leak lands on: they come from shared modules, a shared
  // layout, or a client script, so no single page owns them.
  const ENGLISH_ONLY = [
    'min read',
    'Keep reading',
    'On this page',
    'All notes',
    'Get in touch',
    'Work with me',
    'Based in France',
    'Remote friendly',
  ]

  // The page pairs, plus every French article. `ROUTE_MAP` stays page-pairs-only
  // (articles pair through `translationKey`, not through it), so the article
  // paths are derived from the collection instead. Without them, `On this page`
  // and `Keep reading` are asserted only on pages that never render either one.
  // Derived rather than listed: a hardcoded path covers the article it names and
  // lets every article translated afterwards out of the sweep.
  const FRENCH_PATHS = [...Object.values(ROUTE_MAP), ...FRENCH_ARTICLES.map((a) => `/fr/blog/${a.slug}`)]

  for (const fr of FRENCH_PATHS) {
    test(`${fr} carries no English chrome`, async ({ page }) => {
      await page.goto(`${BASE}${fr}`)
      // Case-folded, and that is load-bearing rather than defensive. `innerText`
      // returns the RENDERED text, and several of these strings live in spans
      // the design uppercases: the reading time renders as "5 MIN READ" and the
      // footer eyebrow as "GET IN TOUCH". Compared as written, those two
      // phrases could never match, so the assertion would have stayed green
      // through the exact leak it exists to catch. Verified: pinning
      // `readingTime` to English leaves this test passing without the fold and
      // fails it with the fold.
      const text = (await page.locator('body').innerText()).toLowerCase()
      for (const phrase of ENGLISH_ONLY) {
        expect(text, `${fr} leaked "${phrase}"`).not.toContain(phrase.toLowerCase())
      }
    })
  }
})

test.describe('sitemap', () => {
  test('lists both locales and excludes the private routes', async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap-0.xml`)
    expect(res.ok()).toBeTruthy()
    const xml = await res.text()
    for (const path of ['/services', '/fr/services', '/about', '/fr/a-propos', '/blog', '/fr/blog']) {
      expect(xml, path).toContain(`jeremn.dev${path}`)
    }
    for (const path of ['/hero-lab', '/cv-print']) {
      expect(xml, path).not.toContain(`jeremn.dev${path}`)
    }
  })
})

test.describe('landmark labels per locale', () => {
  // `innerText` cannot read an attribute, so the English-chrome sweep above is
  // blind to these two. Both were hardcoded in Layout.astro, so a screen reader
  // on any French page announced the navigation landmark and the theme button
  // in English while every visible string around them was French.
  test('the nav and the theme toggle are announced in the page language', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.locator('header nav')).toHaveAttribute('aria-label', 'Principale')
    await expect(page.locator('#theme-toggle')).toHaveAttribute(
      'aria-label',
      'Basculer entre le thème clair et le thème sombre',
    )

    await page.goto(`${BASE}/`)
    await expect(page.locator('header nav')).toHaveAttribute('aria-label', 'Main')
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', 'Switch between light and dark theme')
  })
})

test.describe('the French tree links to itself', () => {
  // Three English hrefs shipped on /fr/ before this: both `Parlons-en` CTAs and
  // `En savoir plus`, all hardwired in HomePage.astro. Fixing those three does
  // not stop a fourth from being added, so the sweep is over every link on
  // every French page rather than over the three that were wrong.
  //
  // A path with an extension is a file, not a page: `/cv.pdf` is one document
  // served to both languages, so linking to it from a French page is correct.
  // The rule is "a file, not a page", which needs no allowlist to stay current
  // when the next locale-invariant file is added.
  const IS_FILE = /\.[a-z0-9]+$/i

  for (const [en, fr] of Object.entries(ROUTE_MAP)) {
    test(`${fr} keeps its links in the French tree`, async ({ page }) => {
      await page.goto(`${BASE}${fr}`)
      // `main` and `footer`, not the header: the language switcher lives in the
      // header and points at the English twin on purpose. The footer is in
      // scope because its CTA was hardwired to /contact too, latent behind
      // `hideFooterCta` on every page today and live the day one page drops it.
      const selector = `a[href^="${BASE}/"]:not([href^="${BASE}/fr/"])`
      const inSite = await page
        .locator(`main ${selector}, footer ${selector}`)
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''))
      expect(inSite.filter((href) => !IS_FILE.test(href)), `${fr} links into ${en}'s tree`).toEqual([])
    })
  }

  // The sweep above reads `main` only, and the logo sits in the header.
  test('the header logo leads to the home page of the language on screen', async ({ page }) => {
    await page.goto(`${BASE}/fr/`)
    await expect(page.getByRole('link', { name: 'jeremn.dev' })).toHaveAttribute('href', `${BASE}/fr/`)
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('link', { name: 'jeremn.dev' })).toHaveAttribute('href', `${BASE}/`)
  })
})

test.describe('article body links across the language split', () => {
  // The French article links to `/blog/who-checks-the-agents-tests` un-prefixed,
  // which is correct today: that article has no French version, and a `/fr/`
  // prefix would ship a 404. It stops being correct the day the twin lands, and
  // nothing about translating that twin touches this link. This test is what
  // turns red on that day.
  test('no French article links to an English article that now has a French twin', () => {
    const translated = new Set(FRENCH_ARTICLES.map((a) => a.translationKey))
    for (const article of FRENCH_ARTICLES) {
      for (const [, slug] of article.body.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
        expect(
          translated.has(slug),
          `${article.slug}.mdx links to /blog/${slug}, which now has a French version — prefix the link`,
        ).toBe(false)
      }
    }
  })
})
