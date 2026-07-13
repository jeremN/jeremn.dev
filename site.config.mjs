// Single source of truth for the deploy target, shared by astro.config.mjs,
// playwright.config.ts, and the e2e specs. Links, canonicals, the noindex guard,
// and the tests all derive from these two values.

export const SITE = 'https://jeremn.dev'

/** URL path prefix. '' when served from the domain root (the apex domain). */
export const BASE = ''
