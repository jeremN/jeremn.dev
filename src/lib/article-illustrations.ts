import type { DoodleName } from '../components/site/Doodle.astro'

// Which Xiaohei illustration heads an Article page. Keyed by `translationKey`
// rather than by tag: each illustration was drawn for one specific post, so
// there is no reasonable fallback the way `markForTags` has one for Writing's
// row marks. A key with no entry here renders no illustration at all.
// `translationKey` rather than the slug, so an article and its translation
// share one drawing instead of duplicating the asset. Every English article's
// key equals its own slug, so the English lookups are the same lookups.
const BY_KEY: Record<string, DoodleName> = {
  'ten-months-of-svelte-5': 'xiaohei-article-ten-months-of-svelte-5',
  'two-years-of-renovate-part-one': 'xiaohei-article-renovate-part-one',
  'two-years-of-renovate-part-two': 'xiaohei-article-renovate-part-two',
  'two-years-of-renovate-part-three': 'xiaohei-article-renovate-part-three',
  'two-years-of-renovate-part-four': 'xiaohei-article-renovate-part-four',
  'best-model-still-needs-rules': 'xiaohei-article-best-model-still-needs-rules',
  'who-checks-the-agents-tests': 'xiaohei-article-who-checks-the-agents-tests',
  'stryker-on-a-svelte-monorepo': 'xiaohei-article-stryker-on-a-svelte-monorepo',
  'contract-tests-without-the-stack': 'xiaohei-article-contract-tests-without-the-stack',
}

/**
 * Pick an Article page's illustration from its `translationKey`.
 *
 * Returns `undefined` for any key not in the map, on purpose: a new post
 * without an illustration yet should render without one, not borrow a
 * stranger's artwork.
 */
export function illustrationForKey(key: string): DoodleName | undefined {
  return BY_KEY[key]
}

// Each illustration's own tight ink bounding box (each SVG's viewBox is
// cropped to it, plus a small margin), as a `width / height` pair for the
// CSS `aspect-ratio` property. Every source canvas started at a shared
// 984x540, but the actual drawing occupies a different region and scale in
// each one, so unlike Writing's row marks there is no single shared ratio:
// showing the full illustration at its own ratio (rather than force-fitting
// a shared crop window, which used to slice most of the width off and, for
// the sparser compositions, still leave dead vertical space around the
// subject) is what removes both problems at once.
// Keyed on `translationKey` too, for the same reason as the table above.
const ASPECT_BY_KEY: Record<string, string> = {
  'ten-months-of-svelte-5': '919.91 / 260.05',
  'two-years-of-renovate-part-one': '549.83 / 473.66',
  'two-years-of-renovate-part-two': '840.36 / 516.73',
  'two-years-of-renovate-part-three': '903.42 / 368.02',
  'two-years-of-renovate-part-four': '485.88 / 378.00',
  'best-model-still-needs-rules': '906.63 / 430.22',
  'who-checks-the-agents-tests': '870.16 / 228.36',
  'stryker-on-a-svelte-monorepo': '801.51 / 411.07',
  'contract-tests-without-the-stack': '662.30 / 429.60',
}

/** CSS `aspect-ratio` value for a post's illustration, looked up by
 *  `translationKey`, or `undefined` if it has none. */
export function articleAspectForKey(key: string): string | undefined {
  return ASPECT_BY_KEY[key]
}
