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
