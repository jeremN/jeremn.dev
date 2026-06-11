import { createFileRoute } from '@tanstack/react-router'
import { PageTitle } from '../components/site/PageTitle'

export const Route = createFileRoute('/freelance')({ component: Freelance })

function Freelance() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 pb-24">
      <PageTitle eyebrow="Work with me">Freelance</PageTitle>
      <p className="text-muted">
        Replace this with your services, rates, and contact details.
      </p>
    </main>
  )
}
