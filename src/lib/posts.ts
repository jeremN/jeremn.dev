import type { CollectionEntry } from 'astro:content'

/** A post is visible when it is published, or when we are running `astro dev`
 *  and want to see drafts while writing them. Four call sites need exactly
 *  this rule and must not drift apart: the two article routes, the blog index,
 *  and the article page's twin lookup, whose disagreement with the routes
 *  advertised an `hreflang` for a page the build never wrote. */
export const isVisible = ({ data }: CollectionEntry<'blog'>): boolean =>
  !data.draft || import.meta.env.DEV
