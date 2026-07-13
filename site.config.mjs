// Single source of truth for the deploy target, shared by astro.config.mjs,
// playwright.config.ts, and the e2e specs.
//
// TEMPORARY: serving from the GitHub Pages project subpath while jeremn.dev is
// unregistered. To go live on the apex domain, change these two lines only:
//
//   export const SITE = 'https://jeremn.dev'
//   export const BASE = ''
//
// Everything else (links, canonicals, noindex, tests) derives from them.

export const SITE = 'https://jeremn.github.io'

/** URL path prefix. '' when served from the domain root. */
export const BASE = '/jeremn.dev'
