import type { DoodleName } from '../components/site/Doodle.astro'

// Which Xiaohei illustration heads an Article page. Keyed by post slug (the
// MDX filename without its extension) rather than by tag: each illustration
// was drawn for one specific post, so there is no reasonable fallback the
// way `markForTags` has one for Writing's row marks. A slug with no entry
// here renders no illustration at all.
const BY_SLUG: Record<string, DoodleName> = {
  'ten-months-of-svelte-5': 'xiaohei-article-ten-months-of-svelte-5',
  'two-years-of-renovate-part-one': 'xiaohei-article-renovate-part-one',
  'two-years-of-renovate-part-two': 'xiaohei-article-renovate-part-two',
  'two-years-of-renovate-part-three': 'xiaohei-article-renovate-part-three',
  'two-years-of-renovate-part-four': 'xiaohei-article-renovate-part-four',
  'best-model-still-needs-rules': 'xiaohei-article-best-model-still-needs-rules',
  'who-checks-the-agents-tests': 'xiaohei-article-who-checks-the-agents-tests',
  'stryker-on-a-svelte-monorepo': 'xiaohei-article-stryker-on-a-svelte-monorepo',
}

/**
 * Pick an Article page's illustration from its post slug.
 *
 * Returns `undefined` for any slug not in the map, on purpose: a new post
 * without an illustration yet should render without one, not borrow a
 * stranger's artwork.
 */
export function illustrationForSlug(slug: string): DoodleName | undefined {
  return BY_SLUG[slug]
}

// The mobile crop (see [...slug].astro) center-crops every 984x540
// illustration to the same horizontal window by default. That default reads
// fine when a post's subject sits near the source's own horizontal center,
// but three posts draw their subject far enough off-center that the default
// window either cuts it out entirely or lets an unrelated, disconnected
// fragment from the far edge poke into frame. Each override below is the
// `left` percentage (see the default's -64.61% in the template) that slides
// the crop window until that post's subject sits inside it. Derived from
// each SVG's own path geometry, not eyeballed: the visible window is
// 429.3 source px wide (984 / 2.2921), so `left` ranges from 0% (flush
// left) to -129.21% (flush right) before it runs past the artwork.
const MOBILE_CROP_OFFSET: Partial<Record<string, string>> = {
  'stryker-on-a-svelte-monorepo': '-61.89%',
  'best-model-still-needs-rules': '-123.62%',
  'two-years-of-renovate-part-two': '0%',
}

/** Mobile-crop `left` offset for a post slug, or the shared default. */
export function mobileCropOffsetForSlug(slug: string): string {
  return MOBILE_CROP_OFFSET[slug] ?? '-64.61%'
}
