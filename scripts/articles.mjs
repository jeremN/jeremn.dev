// The blog collection, read straight off disk rather than through Astro.
//
// Shared by `npm run og` and the e2e sweeps. Both need "the list of articles"
// before a build exists — the render script runs against a dev server it just
// started, and the sweeps build their test list at collection time — so
// neither can ask `getCollection`. One reader keeps them from disagreeing
// about what counts as an article.
import { readFileSync, readdirSync } from 'node:fs'

/**
 * Deliberately does NOT read `title`: the frontmatter regex stops at the first
 * quote, and a French title carrying an apostrophe would come back truncated
 * with no error. Anything that needs the title reads it through Astro.
 *
 * @param {string} dir absolute path to src/content/blog
 * @returns {{slug: string, lang: string, translationKey: string,
 *            publishedAt: string, draft: boolean, body: string}[]}
 */
export function readArticles(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => {
      // Split on the frontmatter fences. `parts[1]` is the frontmatter; the
      // rest is the body, rejoined because `---` is also a horizontal rule.
      const parts = readFileSync(`${dir}/${file}`, 'utf8').split(/^---$/m)
      const front = parts[1] ?? ''
      const field = (name) =>
        front.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'))?.[1] ?? ''
      return {
        slug: file.replace(/\.mdx?$/, ''),
        lang: field('lang') || 'en',
        translationKey: field('translationKey'),
        publishedAt: field('publishedAt'),
        draft: field('draft') === 'true',
        body: parts.slice(2).join('---'),
      }
    })
}

/** The route an article is published at, derived from its language. */
export const routeOf = (article) =>
  article.lang === 'fr' ? `/fr/blog/${article.slug}` : `/blog/${article.slug}`
