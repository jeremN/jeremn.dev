import { createFileRoute } from '@tanstack/react-router'
import { PageTitle } from '../../components/site/PageTitle'

export const Route = createFileRoute('/blog/')({ component: BlogIndex })

// Placeholder — wired to the posts service + masonry card grid in Task 10.
function BlogIndex() {
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
      <PageTitle eyebrow="Selected writing">
        Réflexions
        <br />& histoires
      </PageTitle>
      <p className="text-muted">
        Posts are coming — wired to the database in a later step.
      </p>
    </main>
  )
}
