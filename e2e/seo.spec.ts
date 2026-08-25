import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'
import { readArticles, routeOf } from '../scripts/articles.mjs'
import { serialiseLd } from '../src/lib/structured-data'

// Every route that carries a structured-data block, with the type it must
// declare. A page missing from this table is a page the sweep cannot check, so
// the sweep below also asserts that the pages NOT listed carry no block at all.
const TYPED: Record<string, string> = {
  '/': 'WebSite',
  '/fr/': 'WebSite',
  '/services': 'ProfessionalService',
  '/fr/services': 'ProfessionalService',
  '/about': 'Person',
  '/fr/a-propos': 'Person',
}

const BLOG_DIR = fileURLToPath(new URL('../src/content/blog', import.meta.url))
const ARTICLES = readArticles(BLOG_DIR).filter((a) => !a.draft)

test.describe('the JSON-LD serialiser', () => {
  // The one guard between an author-written headline and an injected tag.
  // Tested directly rather than through a page: reaching it through a page
  // would need an article whose title carries `</script>`, which is a strange
  // thing to commit to the blog just to keep a test honest.
  test('neutralises a closing script tag and still round-trips', () => {
    const headline = 'Bad </script><img src=x onerror=alert(1)>'
    const out = serialiseLd({ headline })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
    expect(JSON.parse(out).headline).toBe(headline)
  })
})

test.describe('structured data', () => {
  const parse = async (page: import('@playwright/test').Page) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    return blocks.map((b) => JSON.parse(b))
  }

  for (const [route, type] of Object.entries(TYPED)) {
    test(`${route} declares one ${type} block`, async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      const blocks = await parse(page)
      expect(blocks).toHaveLength(1)
      expect(blocks[0]['@type']).toBe(type)
      expect(blocks[0]['@context']).toBe('https://schema.org')
    })
  }

  test('the home and services blocks name the professional profiles', async ({ page }) => {
    for (const route of ['/', '/fr/', '/services', '/fr/services']) {
      await page.goto(`${BASE}${route}`)
      const [block] = await parse(page)
      const person = (block.author ?? block.provider) as { sameAs: string[] }
      expect(person.sameAs, route).toEqual(
        expect.arrayContaining([expect.stringContaining('github.com'), expect.stringContaining('linkedin.com')]),
      )
    }
  })

  // The site prints the address nowhere but a `mailto:` href. A machine
  // readable `email` field in the head would hand it to every scraper that
  // rule exists to stop, so no block may carry one.
  test('no block prints the email address', async ({ page }) => {
    for (const route of [...Object.keys(TYPED), routeOf(ARTICLES[0])]) {
      await page.goto(`${BASE}${route}`)
      const blocks = await parse(page)
      expect(blocks.length, `${route} carries no block, so this checked nothing`).toBeGreaterThan(0)
      for (const block of blocks) {
        expect(JSON.stringify(block), route).not.toContain('@proton.me')
      }
    }
  })

  test('every article declares a BlogPosting tied to its own URL', async ({ page }) => {
    expect(ARTICLES.length, 'the article sweep found nothing to sweep').toBeGreaterThan(0)
    for (const article of ARTICLES) {
      const route = routeOf(article)
      await page.goto(`${BASE}${route}`)
      const [block] = await parse(page)
      expect(block, route).toBeDefined()
      expect(block['@type'], route).toBe('BlogPosting')
      expect(block.inLanguage, route).toBe(article.lang)
      expect(block.url, route).toContain(route)
      expect(block.mainEntityOfPage['@id'], route).toContain(route)
      expect(block.datePublished, route).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(block.headline, route).toBeTruthy()
    }
  })
})

test.describe('Open Graph', () => {
  const meta = (page: import('@playwright/test').Page, property: string) =>
    page.locator(`meta[property="${property}"]`).getAttribute('content')

  test('articles are articles and carry their publication date', async ({ page }) => {
    expect(ARTICLES.length, 'the article sweep found nothing to sweep').toBeGreaterThan(0)
    for (const article of ARTICLES) {
      const route = routeOf(article)
      await page.goto(`${BASE}${route}`)
      expect(await meta(page, 'og:type'), route).toBe('article')
      expect(await meta(page, 'article:published_time'), route).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(await meta(page, 'article:author'), route).toBe('Jérémie Néhlil')
    }
  })

  test('every other page stays a website and carries no article date', async ({ page }) => {
    for (const route of Object.keys(TYPED)) {
      await page.goto(`${BASE}${route}`)
      expect(await meta(page, 'og:type'), route).toBe('website')
      await expect(page.locator('meta[property="article:published_time"]'), route).toHaveCount(0)
    }
  })
})

test.describe('titles and descriptions', () => {
  const ROUTES = [...Object.keys(TYPED), '/contact', '/fr/contact', '/blog', '/fr/blog', '/freelance', '/fr/freelance']

  // Google truncates a description near 160 characters. Past that the tail is
  // written for nobody. The floor catches the opposite failure: a page that
  // silently fell back to the layout default.
  test('every page writes its own description, and keeps it under 160 characters', async ({ page }) => {
    const seen = new Set<string>()
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`)
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description, route).toBeTruthy()
      expect(description!.length, `${route} description is ${description!.length} characters`).toBeLessThanOrEqual(160)
      expect(description!.length, route).toBeGreaterThan(60)
      expect(seen.has(description!), `${route} reuses another page's description`).toBe(false)
      seen.add(description!)
    }
  })

  // The home page shipped for months on the layout's fallback title, which
  // said 'Jérémie Néhlil' and nothing about the work on offer.
  test('every page writes its own title, and no title is the bare name', async ({ page }) => {
    const seen = new Set<string>()
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`)
      const title = await page.title()
      expect(title, route).not.toBe('Jérémie Néhlil')
      expect(seen.has(title), `${route} reuses another page's title`).toBe(false)
      seen.add(title)
    }
  })
})

test.describe('feeds', () => {
  const FEEDS: Record<string, { lang: string; prefix: string }> = {
    '/rss.xml': { lang: 'en', prefix: `${BASE}/blog/` },
    '/fr/rss.xml': { lang: 'fr', prefix: `${BASE}/fr/blog/` },
  }

  for (const [path, { lang, prefix }] of Object.entries(FEEDS)) {
    test(`${path} lists ${lang} articles and nothing else`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`)
      expect(res.status()).toBe(200)
      const xml = await res.text()
      expect(xml).toContain(`<language>${lang}</language>`)

      const links = [...xml.matchAll(/<link>(.*?)<\/link>/g)].map((m) => m[1])
      // The first <link> is the channel's own, which points at this locale's
      // tree rather than at the shared root. The rest are the items.
      const [channel, ...items] = links
      expect(channel).toContain(prefix.replace('/blog/', '/'))
      expect(items.length, `${path} lists no article`).toBeGreaterThan(0)

      const expected = ARTICLES.filter((a) => a.lang === lang).length
      expect(items).toHaveLength(expected)
      for (const item of items) {
        expect(item, `${path} links outside its own tree`).toContain(prefix)
      }
    })
  }

  test('every page advertises both feeds', async ({ page }) => {
    for (const route of ['/', '/fr/', '/blog', '/fr/blog']) {
      await page.goto(`${BASE}${route}`)
      const feeds = page.locator('link[rel="alternate"][type="application/rss+xml"]')
      await expect(feeds, route).toHaveCount(2)
      expect(await feeds.nth(0).getAttribute('href')).toBe(`${BASE}/rss.xml`)
      expect(await feeds.nth(1).getAttribute('href')).toBe(`${BASE}/fr/rss.xml`)
    }
  })
})

test.describe('sitemap', () => {
  const load = async (request: import('@playwright/test').APIRequestContext) => {
    const res = await request.get(`${BASE}/sitemap-0.xml`)
    expect(res.status()).toBe(200)
    const xml = await res.text()
    return [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => ({
      loc: m[0].match(/<loc>(.*?)<\/loc>/)![1],
      lastmod: m[0].match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null,
    }))
  }

  test('every article carries the lastmod its frontmatter declares', async ({ request }) => {
    const urls = await load(request)
    expect(ARTICLES.length).toBeGreaterThan(0)
    for (const article of ARTICLES) {
      const entry = urls.find((u) => new URL(u.loc).pathname === `${routeOf(article)}/`)
      expect(entry, `${routeOf(article)} is missing from the sitemap`).toBeDefined()
      expect(entry!.lastmod, routeOf(article)).toBe(new Date(article.publishedAt).toISOString())
    }
  })

  // A `lastmod` the build invents on every deploy tells a crawler the page
  // changed when it did not, which is worse than saying nothing.
  test('no page other than an article claims a lastmod', async ({ request }) => {
    const articleRoutes = new Set(ARTICLES.map((a) => `${routeOf(a)}/`))
    for (const url of await load(request)) {
      const path = new URL(url.loc).pathname
      if (articleRoutes.has(path)) continue
      expect(url.lastmod, `${path} claims a lastmod`).toBeNull()
    }
  })

  test('the card source pages stay out of the sitemap and stay noindex', async ({ request, page }) => {
    for (const url of await load(request)) {
      expect(new URL(url.loc).pathname, 'a card source page is listed').not.toContain('/og/')
    }
    await page.goto(`${BASE}/og/site`)
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1)
  })

  test('every article social card resolves', async ({ request }) => {
    expect(ARTICLES.length).toBeGreaterThan(0)
    for (const article of ARTICLES) {
      const res = await request.get(`${BASE}/og/${article.slug}.jpg`)
      expect(res.status(), `/og/${article.slug}.jpg`).toBe(200)
    }
    for (const card of ['site', 'site-fr']) {
      expect((await request.get(`${BASE}/og/${card}.jpg`)).status(), card).toBe(200)
    }
  })
})

test.describe('internal links inside articles', () => {
  // Translated slugs make this worth a test. An English article's links were
  // written once and never move; a French article's are hand-rewritten to point
  // at French slugs, and a typo there produces a 404 that nothing else notices.
  // The sweep reads the bodies off disk, so an article added later joins it.
  const linksOf = (body: string) =>
    [...body.matchAll(/]\((\/[^)\s]*)\)/g)].map((m) => m[1])

  test('every in-site link in every article resolves', async ({ request }) => {
    expect(ARTICLES.length).toBeGreaterThan(0)
    let checked = 0
    for (const article of ARTICLES) {
      for (const link of linksOf(article.body)) {
        const res = await request.get(`${BASE}${link}`)
        expect(res.status(), `${article.slug} links to ${link}`).toBe(200)
        checked += 1
      }
    }
    expect(checked, 'no article link was checked').toBeGreaterThan(0)
  })

  // The point of translating an article is that a French reader stays in the
  // French tree. A link out to English is correct only while no twin exists.
  test('no French article links into the English tree when a twin exists', async () => {
    const frenchKeys = new Set(ARTICLES.filter((a) => a.lang === 'fr').map((a) => a.translationKey))
    const englishSlugToKey = new Map(
      ARTICLES.filter((a) => a.lang === 'en').map((a) => [a.slug, a.translationKey]),
    )
    for (const article of ARTICLES.filter((a) => a.lang === 'fr')) {
      for (const link of linksOf(article.body)) {
        const match = link.match(/^\/blog\/([^/]+)\/?$/)
        if (!match) continue
        const key = englishSlugToKey.get(match[1])
        expect(
          key && frenchKeys.has(key),
          `${article.slug} links to the English ${link}, which now has a French twin`,
        ).toBeFalsy()
      }
    }
  })
})
