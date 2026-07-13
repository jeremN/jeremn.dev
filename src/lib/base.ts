// Astro rewrites asset URLs for `base`, but not hand-written link/href paths.
// These helpers keep in-site paths correct under both deploy targets: the apex
// domain (base '/') and the GitHub Pages project subpath (base '/jeremn.dev').
// With base '/', BASE is '' and every helper is a no-op.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Prefix an absolute in-site path (e.g. '/cv') with the configured base. */
export const withBase = (path: string): string => `${BASE}${path}`

/** Strip the base off a runtime pathname, yielding the base-independent route. */
export const toRoute = (pathname: string): string =>
  BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname

/** True when serving from a subpath — i.e. the temporary github.io deploy,
 *  which must not be indexed and compete with the real domain. */
export const isSubpathDeploy = BASE !== ''
