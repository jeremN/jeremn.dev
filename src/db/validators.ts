import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { post } from './schema'

export const postSelectSchema = createSelectSchema(post)

export const postInsertSchema = createInsertSchema(post, {
  slug: (s) => s.min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  title: (s) => s.min(1),
  bodyMarkdown: (s) => s.min(1),
  tags: z.array(z.string()),
}).omit({ id: true, createdAt: true, updatedAt: true })

export type PostInsert = z.infer<typeof postInsertSchema>
