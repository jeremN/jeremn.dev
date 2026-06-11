import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const post = sqliteTable('post', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  bodyMarkdown: text('body_markdown').notNull(),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  tags: text('tags', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type Post = typeof post.$inferSelect
export type NewPost = typeof post.$inferInsert
