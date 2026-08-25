import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { BASE } from '../site.config.mjs'
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
const ARTICLES = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((file) => {
    const front = readFileSync(`${BLOG_DIR}/${file}`, 'utf8').split(/^---$/m)[1] ?? ''
    const field = (name: string) =>
      front.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'))?.[1] ?? ''
    return { slug: file.replace(/\.mdx$/, ''), lang: field('lang'), draft: field('draft') === 'true' }
  })
  .filter((a) => !a.draft)

const routeOf = (a: { slug: string; lang: string }) =>
  a.lang === 'fr' ? `/fr/blog/${a.slug}` : `/blog/${a.slug}`

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
