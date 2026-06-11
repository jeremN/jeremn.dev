import { Link } from '@tanstack/react-router'

type CardPost = {
  slug: string
  title: string
  summary: string
  tags: string[]
  publishedAt: Date | null
}

export function PostCard({ post }: { post: CardPost }) {
  return (
    <article className="group mb-6 break-inside-avoid rounded-2xl border border-line bg-surface/40 p-6 transition-colors hover:border-accent/60">
      {post.publishedAt && (
        <time className="eyebrow mb-3 block">
          {post.publishedAt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      )}
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="no-underline"
      >
        <h2 className="font-display text-2xl font-medium leading-tight tracking-tight text-ink transition-colors group-hover:text-accent">
          {post.title}
        </h2>
      </Link>
      {post.summary && <p className="mt-2 text-sm text-muted">{post.summary}</p>}
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.65rem] text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="eyebrow mt-5 inline-block no-underline transition-colors group-hover:text-accent"
      >
        Read →
      </Link>
    </article>
  )
}
