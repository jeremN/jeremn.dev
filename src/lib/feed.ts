// One builder for both feeds. `/rss.xml` and `/fr/rss.xml` differ only by the
// locale they filter on and the copy they title themselves with, so the two
// routes are thin wrappers and the shared logic lives here.
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { isVisible } from './posts'
import { withBase } from './base'
import { getCopy, type Locale } from '../i18n'

/**
 * The feed for one locale.
 *
 * Each feed lists only its own language. A reader subscribes in the language
 * they read; mixing the two would push articles they cannot use into the same
 * timeline, and the `<language>` element would then be a lie.
 */
export async function feedFor(lang: Locale, site: URL | undefined) {
  const posts = (await getCollection('blog', isVisible))
    .filter((post) => post.data.lang === lang)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
  const t = getCopy(lang, 'blog')
  const prefix = lang === 'fr' ? '/fr/blog' : '/blog'

  return rss({
    title: t.title,
    description: t.description,
    // The channel link points at this locale's tree, not at the shared root:
    // a French feed whose `<link>` leads to the English home page sends every
    // reader who clicks the feed title to a page they cannot read.
    // `site` comes from the route's own context rather than the config, so a
    // subpath deploy emits its own origin instead of the apex domain's.
    site: new URL(withBase(lang === 'fr' ? '/fr/' : '/'), site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.publishedAt,
      categories: post.data.tags,
      link: withBase(`${prefix}/${post.id}/`),
    })),
    customData: `<language>${lang}</language>`,
  })
}
