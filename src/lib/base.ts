// Astro rewrites asset URLs for `base`, but not hand-written link/href paths.
// These helpers keep in-site paths correct under both deploy targets: the apex
// domain (base '/') and the GitHub Pages project subpath (base '/jeremn.dev').
// With base '/', BASE is '' and every helper is a no-op.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Prefix an absolute in-site path (e.g. '/about') with the configured base. */
export const withBase = (path: string): string => `${BASE}${path}`

/** Strip the base off a runtime pathname, yielding the base-independent route. */
export const toRoute = (pathname: string): string =>
  BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname

/** True when serving from a subpath — i.e. the temporary github.io deploy,
 *  which must not be indexed and compete with the real domain. */
export const isSubpathDeploy = BASE !== ''

/** Absolute URL for an in-site route, for canonical, Open Graph and JSON-LD.
 *  `import.meta.env.SITE` is Astro's own copy of the `site` config value, which
 *  astro.config.mjs reads from site.config.mjs — so this stays one source of
 *  truth rather than a second hardcoded origin. */
export const absolute = (route: string): string =>
  import.meta.env.SITE ? new URL(withBase(route), import.meta.env.SITE).href : withBase(route)
