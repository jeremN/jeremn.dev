import { describe, expect, it } from 'vitest'
import { post } from '../db/schema'
import { createTestDb } from '../db/test-utils'
import { getPublishedPostBySlug, listPublishedPosts } from './posts'

describe('posts service', () => {
  it('lists only published posts, newest first', async () => {
    const db = await createTestDb()
    await db.insert(post).values([
      { slug: 'draft-one', title: 'Draft', bodyMarkdown: 'x', status: 'draft' },
      {
        slug: 'older',
        title: 'Older',
        bodyMarkdown: 'x',
        status: 'published',
        publishedAt: new Date('2024-01-01'),
      },
      {
        slug: 'newer',
        title: 'Newer',
        bodyMarkdown: 'x',
        status: 'published',
        publishedAt: new Date('2025-01-01'),
      },
    ])

    const posts = await listPublishedPosts(db)

    expect(posts.map((p) => p.slug)).toEqual(['newer', 'older'])
  })

  it('returns a published post by slug, and null for drafts/missing', async () => {
    const db = await createTestDb()
    await db.insert(post).values([
      {
        slug: 'live',
        title: 'Live',
        bodyMarkdown: 'hello',
        status: 'published',
        publishedAt: new Date('2025-01-01'),
      },
      { slug: 'hidden', title: 'Hidden', bodyMarkdown: 'x', status: 'draft' },
    ])

    expect((await getPublishedPostBySlug(db, 'live'))?.title).toBe('Live')
    expect(await getPublishedPostBySlug(db, 'hidden')).toBeNull()
    expect(await getPublishedPostBySlug(db, 'nope')).toBeNull()
  })
})
