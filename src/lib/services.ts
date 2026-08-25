// Single source of truth for what I offer. The homepage teases it and
// /freelance presents it in full, so a second hand-typed list would drift the
// first time either changes — the same reason cv.ts exists.
//
// The wording is the author's own, from the v1 /freelance page. Two entries
// split its "Fullstack features" row, because the icon set gives the interface
// and the service layer separate marks.
import type { DoodleName } from '../components/site/Doodle.astro'
import type { Locale } from '../i18n'

export type Service = {
  icon: DoodleName
  title: string
  /** One line, for the homepage grid. */
  blurb: string
  /** The longer form /freelance shows. Absent means the blurb carries it. */
  detail?: string
}

const en: Service[] = [
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

const fr: Service[] = [
  {
    icon: 'svc-frontend',
    title: 'Applications web frontend',
    blurb: 'SvelteKit, Next.js, React et TypeScript. Des interfaces accessibles qui restent maintenables après la mise en ligne.',
  },
  {
    icon: 'svc-fullstack',
    title: 'Fonctionnalités fullstack',
    blurb: "Une livraison de bout en bout, de l'interface jusqu'aux données qu'elle lit.",
  },
  {
    icon: 'svc-backend',
    title: 'APIs et backends',
    blurb: 'Des services Node et Fastify, en GraphQL et en REST.',
  },
  {
    icon: 'svc-performance',
    title: 'Refontes de performance',
    blurb: 'Le refactoring de sites à fort trafic pour la vitesse et les Core Web Vitals.',
  },
  {
    icon: 'svc-automation',
    title: 'Tooling et DX',
    blurb: 'CI/CD, tests, design systems et outils internes.',
  },
  {
    icon: 'svc-ai',
    title: 'Tooling LLM et agents',
    blurb: "Des harnais d'agents, des serveurs MCP, de la recherche documentaire et des évaluations.",
    detail: 'La plomberie qui rend les fonctionnalités LLM fiables.',
  },
]

export const getServices = (lang: Locale): Service[] => (lang === 'fr' ? fr : en)

// How I work, from the v1 /freelance page. Kept verbatim.
const howIWorkEn = [
  'Embed in your team. Years of régie and consulting experience, most recently a 14-person team at ViaMichelin.',
  'Senior and autonomous. Agile delivery.',
  'French and English.',
  'On-site near Paris, or fully remote.',
]

const howIWorkFr: typeof howIWorkEn = [
  "Intégré à votre équipe. Plusieurs années d'expérience en régie et en conseil, dont récemment une équipe de 14 personnes chez ViaMichelin.",
  'Senior et autonome. Livraison agile.',
  'Français et anglais.',
  'Sur site près de Paris, ou entièrement à distance.',
]

export const getHowIWork = (lang: Locale): string[] => (lang === 'fr' ? howIWorkFr : howIWorkEn)
