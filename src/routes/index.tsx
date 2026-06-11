import { createFileRoute, Link } from '@tanstack/react-router'
import { Eyebrow } from '../components/site/Eyebrow'

export const Route = createFileRoute('/')({ component: Home })

// Minimal editorial placeholder. The WebGL galaxy hero + "selected writing"
// section land in Task 13 (homepage composition).
function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[78vh] max-w-5xl flex-col justify-center px-6">
      <Eyebrow className="mb-6 block">Freelance software engineer</Eyebrow>
      <h1 className="font-grotesk text-6xl font-extrabold leading-[0.92] tracking-tight text-ink sm:text-8xl">
        Jérémie
        <br />
        Néhlil
      </h1>
      <p className="mt-6 max-w-xl font-display text-xl italic text-muted">
        I build web apps and the tooling around them.
      </p>
      <div className="mt-10 flex gap-7">
        <Link to="/blog" className="group no-underline">
          <Eyebrow className="transition-colors group-hover:text-accent">
            Read the writing →
          </Eyebrow>
        </Link>
        <Link to="/freelance" className="group no-underline">
          <Eyebrow className="transition-colors group-hover:text-accent">
            Work with me →
          </Eyebrow>
        </Link>
      </div>
    </main>
  )
}
