import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../db'
import { type Post, post } from '../db/schema'

export async function listPublishedPosts(db: Db): Promise<Post[]> {
  return db
    .select()
    .from(post)
    .where(eq(post.status, 'published'))
    .orderBy(desc(post.publishedAt))
}

export async function getPublishedPostBySlug(
  db: Db,
  slug: string,
): Promise<Post | null> {
  const rows = await db
    .select()
    .from(post)
    .where(and(eq(post.slug, slug), eq(post.status, 'published')))
    .limit(1)
  return rows[0] ?? null
}
