import { createFileRoute, Link } from '@tanstack/react-router'
import { GalaxyHero } from '../components/hero/GalaxyHero'
import { Eyebrow } from '../components/site/Eyebrow'
import { PostCard } from '../components/site/PostCard'
import { listPostsFn } from '../server/posts'

export const Route = createFileRoute('/')({
  loader: async () => {
    // The hero is the point of the homepage; the writing teaser is secondary.
    // If the posts DB is unreachable, degrade to an empty list (logged) rather
    // than 500-ing the whole page.
    try {
      return (await listPostsFn()).slice(0, 3)
    } catch (err) {
      console.error('home: failed to load latest posts:', err)
      return []
    }
  },
  component: Home,
})

function Home() {
  const posts = Route.useLoaderData()
  return (
    <>
      {/* Fixed WebGL galaxy behind the page (client-only island). */}
      <GalaxyHero />

      {/* Hero: transparent so the galaxy shows; text is SSR'd for SEO. */}
      <section className="relative z-10 flex min-h-[92vh] flex-col justify-center px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ground/85 via-ground/35 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-5xl">
          <Eyebrow className="mb-6 block text-accent">
            Freelance software engineer
          </Eyebrow>
          <h1 className="font-grotesk text-6xl font-extrabold leading-[0.92] tracking-tight text-ink drop-shadow-[0_2px_40px_rgba(6,5,16,0.9)] sm:text-8xl">
            Jérémie <span className="text-accent">Néhlil</span>
          </h1>
          <p className="mt-6 max-w-[24ch] font-display text-xl text-ink sm:text-2xl">
            I build web apps —{' '}
            <em className="italic text-[#ff8aa6]">
              and the tooling around them.
            </em>
          </p>
          <span className="mt-8 inline-flex items-center gap-2.5 font-mono text-sm text-[#7ee0c8]">
            <span className="h-2 w-2 rounded-full bg-[#7ee0c8] shadow-[0_0_10px_#7ee0c8]" />
            available for freelance work
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-8">
          <div className="mx-auto max-w-5xl px-6">
            <Eyebrow>scroll ↓</Eyebrow>
          </div>
        </div>
      </section>

      {/* Opaque from here down — covers the fixed galaxy as you scroll. */}
      <section className="relative z-10 bg-ground px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Eyebrow className="mb-8 block">Selected writing</Eyebrow>
          {posts.length === 0 ? (
            <p className="text-muted">Posts are coming soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard
                  key={p.slug}
                  post={{
                    ...p,
                    publishedAt: p.publishedAt
                      ? new Date(p.publishedAt)
                      : null,
                  }}
                />
              ))}
            </div>
          )}
          <Link to="/blog" className="group mt-10 inline-block no-underline">
            <Eyebrow className="transition-colors group-hover:text-accent">
              All writing →
            </Eyebrow>
          </Link>
        </div>
      </section>
    </>
  )
}
