import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// The frontmatter contract — same invariants the old Drizzle+Zod `post` table
// enforced, validated at build instead of at insert.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    // The `<meta name="description">` and the JSON-LD `description`. A separate
    // field from `summary`, which is the blurb a reader sees on the blog index
    // and under the article title, and is free to run long. Google truncates a
    // description near 160 characters, so the tail of a longer one is written
    // for nobody. Required, with NO fallback to `summary`: a fallback would
    // quietly restore the overlong description this field exists to prevent,
    // where a missing field fails the build and names the file. The floor sits
    // above the e2e sweep's own floor of 60, so the schema is the stricter gate.
    description: z.string().min(70).max(160),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
    // `lang` defaults so a missing field is not a build break. `translationKey`
    // is required on purpose: an article with no key can never be paired, and a
    // silent gap there is what produces broken hreflang.
    lang: z.enum(['en', 'fr']).default('en'),
    translationKey: z.string(),
  }),
})

export const collections = { blog }
