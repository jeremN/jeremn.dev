// Single source of truth for what I offer. The homepage teases it and
// /freelance presents it in full, so a second hand-typed list would drift the
// first time either changes — the same reason cv.ts exists.
//
// The wording is the author's own, from the v1 /freelance page. Two entries
// split its "Fullstack features" row, because the icon set gives the interface
// and the service layer separate marks.
import type { DoodleName } from '../components/site/Doodle.astro'

export type Service = {
  icon: DoodleName
  title: string
  /** One line, for the homepage grid. */
  blurb: string
  /** The longer form /freelance shows. Absent means the blurb carries it. */
  detail?: string
}

export const services: Service[] = [
  {
    icon: 'svc-frontend',
    title: 'Frontend web apps',
    blurb: 'SvelteKit, Next.js, React and TypeScript. Accessible UIs that stay maintainable past launch.',
  },
  {
    icon: 'svc-fullstack',
    title: 'Fullstack features',
    blurb: 'End-to-end delivery, from the interface down to the data it reads.',
  },
  {
    icon: 'svc-backend',
    title: 'APIs and backends',
    blurb: 'Node and Fastify services, GraphQL and REST.',
  },
  {
    icon: 'svc-performance',
    title: 'Performance rebuilds',
    blurb: 'Refactoring high-traffic sites for speed and Core Web Vitals.',
  },
  {
    icon: 'svc-automation',
    title: 'Tooling and DX',
    blurb: 'CI/CD, testing, design systems and internal tools.',
  },
  {
    icon: 'svc-ai',
    title: 'LLM tooling and agents',
    blurb: 'Agent harnesses, MCP servers, retrieval and evals.',
    detail: 'The plumbing that makes LLM features hold up.',
  },
]

// How I work, from the v1 /freelance page. Kept verbatim.
export const howIWork = [
  'Embed in your team. Years of régie and consulting experience, most recently a 14-person team at ViaMichelin.',
  'Senior and autonomous. Agile delivery.',
  'French and English.',
  'On-site near Paris, or fully remote.',
]
