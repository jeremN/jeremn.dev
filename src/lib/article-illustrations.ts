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
