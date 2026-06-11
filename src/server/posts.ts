import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../db'
import { renderMarkdown } from '../lib/markdown'
import { getPublishedPostBySlug, listPublishedPosts } from '../lib/posts'

export const listPostsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const posts = await listPublishedPosts(getDb())
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    publishedAt: p.publishedAt,
  }))
})

export const getPostFn = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const found = await getPublishedPostBySlug(getDb(), slug)
    if (!found) throw notFound()
    const html = await renderMarkdown(found.bodyMarkdown)
    return {
      title: found.title,
      tags: found.tags,
      publishedAt: found.publishedAt,
      html,
    }
  })
