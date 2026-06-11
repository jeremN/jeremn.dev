import { createFileRoute } from '@tanstack/react-router'
import { PageTitle } from '../../components/site/PageTitle'
import { PostCard } from '../../components/site/PostCard'
import { listPostsFn } from '../../server/posts'

export const Route = createFileRoute('/blog/')({
  loader: () => listPostsFn(),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
      <PageTitle eyebrow="Selected writing">
        Réflexions
        <br />& histoires
      </PageTitle>
      {posts.length === 0 ? (
        <p className="text-muted">No posts published yet.</p>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {posts.map((p) => (
            <PostCard
              key={p.slug}
              post={{
                ...p,
                publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
              }}
            />
          ))}
        </div>
      )}
    </main>
  )
}
