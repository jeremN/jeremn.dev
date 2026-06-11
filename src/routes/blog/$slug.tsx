import { createFileRoute } from '@tanstack/react-router'
import { Eyebrow } from '../../components/site/Eyebrow'
import { getPostFn } from '../../server/posts'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => getPostFn({ data: params.slug }),
  component: BlogPost,
})

function BlogPost() {
  const post = Route.useLoaderData()
  const published = post.publishedAt ? new Date(post.publishedAt) : null
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-8">
      <header className="mb-12">
        {published && (
          <Eyebrow className="mb-4 block">
            {published.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Eyebrow>
        )}
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
          {post.title}
        </h1>
      </header>
      {/*
        Safe: `post.html` is produced by renderMarkdown(), which runs
        rehype-sanitize on the HTML tree BEFORE Shiki highlights it (raw HTML is
        dropped, unsafe URLs/attrs are stripped). Sanitizing happens server-side
        at render, so even agent- or DB-sourced markdown can't inject script.
        Do NOT pass un-rendered/un-sanitized HTML here.
      */}
      <article
        className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-accent prose-pre:rounded-xl prose-pre:border prose-pre:border-line"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </main>
  )
}
