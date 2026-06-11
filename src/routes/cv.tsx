import { createFileRoute } from '@tanstack/react-router'
import { PageTitle } from '../components/site/PageTitle'

export const Route = createFileRoute('/cv')({ component: Cv })

function Cv() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 pb-24">
      <PageTitle eyebrow="Curriculum">CV</PageTitle>
      <p className="text-muted">
        Replace this with your experience, skills, and education.
      </p>
    </main>
  )
}
