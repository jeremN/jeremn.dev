// The JSON-LD blocks the pages emit. Kept out of the templates so each one is
// a plain object a test can parse and assert against, and so the Person block
// has exactly one definition instead of one per page that needs it.
//
// Every builder takes `abs`, a function that turns an in-site route into an
// absolute URL. The pages hold that: it needs `Astro.site` and the deploy base,
// neither of which a lib should reach for.
import type { Locale } from '../i18n'
import { getProfile, links } from './cv'

export type JsonLdObject = Record<string, unknown>

/**
 * Serialises one block for a `<script type="application/ld+json">` body.
 *
 * Every `<` becomes the `\u003c` sequence. Without that, a string holding
 * `</script>` closes the tag early and the browser parses the rest of the JSON
 * as markup. Article headlines come from author-written frontmatter, so that
 * string is reachable. `rehype-sanitize` does not cover this path: it runs on
 * markdown, never on an `.astro` template, so this function is the only guard.
 * `\u003c` is a legal JSON string escape, so a consumer still reads `<`.
 *
 * It lives here rather than inline in `JsonLd.astro` so a test can call it.
 */
export const serialiseLd = (data: JsonLdObject): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

/** Turns an in-site route into an absolute page URL. The pages pass `pageUrl`,
 *  which writes the directory form, so every URL a block names is the same
 *  string the page's own canonical link names. */
export type Abs = (route: string) => string

const homeRoute = (lang: Locale) => (lang === 'fr' ? '/fr/' : '/')

/**
 * The Person block. `sameAs` carries the professional profiles, which is what
 * tells a search engine that these accounts are one person.
 *
 * The email is deliberately absent. The site prints it nowhere but a `mailto:`
 * href, and a machine-readable `email` field in the head would hand it to every
 * scraper the rule exists to stop. `/contact` carries the reachable channels.
 */
export const personLd = (lang: Locale, abs: Abs): JsonLdObject => {
  const profile = getProfile(lang)
  return {
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    url: abs(homeRoute(lang)),
    sameAs: links.map((l) => l.href),
    address: { '@type': 'PostalAddress', addressCountry: 'FR' },
    knowsLanguage: ['fr', 'en'],
  }
}

/** The home page block: the site itself, plus the person behind it. */
export const websiteLd = (lang: Locale, abs: Abs, description: string): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'jeremn.dev',
  url: abs(homeRoute(lang)),
  inLanguage: lang,
  description,
  author: personLd(lang, abs),
})

/**
 * The /about block: the person, as the page's main entity.
 *
 * `Person.url` stays the home page, which is the convention: it is the
 * person's canonical address, not the address of the page describing them.
 * `mainEntityOfPage` is what ties the block to /about itself.
 */
export const aboutLd = (lang: Locale, abs: Abs, route: string): JsonLdObject => ({
  '@context': 'https://schema.org',
  ...personLd(lang, abs),
  mainEntityOfPage: { '@type': 'ProfilePage', '@id': abs(route) },
})

/**
 * The /services block. `areaServed` says France and remote work elsewhere,
 * which is the real offer; `availableLanguage` says a prospect may write in
 * either language.
 */
export const servicesLd = (lang: Locale, abs: Abs, route: string, description: string): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'jeremn.dev',
  url: abs(route),
  inLanguage: lang,
  description,
  areaServed: [
    { '@type': 'Country', name: 'France' },
    { '@type': 'Place', name: 'Remote' },
  ],
  availableLanguage: ['fr', 'en'],
  provider: personLd(lang, abs),
  serviceType: [
    'Fullstack web development',
    'Frontend development',
    'Backend and API development',
    'Performance audit',
    'Automation and tooling',
    'AI integration',
  ],
})

/**
 * One article's block.
 *
 * `datePublished` keeps the date-only form. The frontmatter carries no time, so
 * a full timestamp would invent a precision the source does not have.
 */
export const articleLd = (args: {
  lang: Locale
  abs: Abs
  route: string
  headline: string
  description: string
  publishedAt: Date
  image: string
}): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: args.headline,
  description: args.description,
  datePublished: args.publishedAt.toISOString().slice(0, 10),
  inLanguage: args.lang,
  image: args.image,
  url: args.abs(args.route),
  mainEntityOfPage: { '@type': 'WebPage', '@id': args.abs(args.route) },
  author: personLd(args.lang, args.abs),
})
