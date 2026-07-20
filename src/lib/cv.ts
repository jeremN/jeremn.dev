// Single source of truth for the CV. Both /cv (web) and /cv-print (PDF source)
// read from here. After editing this file, regenerate the downloadable PDF with
// `npm run cv:pdf`. public/cv.pdf is a committed artifact and otherwise goes stale.

export const profile = {
  name: 'Jérémie Néhlil',
  title: 'Senior fullstack JavaScript engineer',
  lead: 'Senior fullstack JavaScript engineer. Frontends in SvelteKit, Next.js, React and TanStack Start, plus the Node backends behind them. Shipping for product teams and agencies since 2016.',
  location: 'Near Paris (Sorel-Moussel), France',
  languages: 'French (native), English (professional)',
  email: 'jeremie.nehlil.freelance@proton.me',
}

export type Mission = {
  client: string
  period: string
  blurb: string
  stack: string[]
  note?: string
}

export type Experience = {
  company: string
  kind: 'freelance' | 'agency'
  role: string
  period: string
  location?: string
  blurb: string
  stack: string[]
  missions?: Mission[]
}

export const experiences: Experience[] = [
  {
    company: 'ViaMichelin',
    kind: 'freelance',
    role: 'Senior fullstack',
    period: '2024–present',
    location: 'Boulogne-Billancourt',
    blurb:
      'Progressive rebuild of the public ViaMichelin site (mapping, routing, related services) within a 14-person product team. SvelteKit + Svelte 5 front on a Fastify GraphQL BFF; Pact contract testing and a Testing-Trophy strategy against silent integration regressions.',
    stack: ['SvelteKit', 'Svelte 5', 'Fastify', 'GraphQL', 'Playwright', 'Pact', 'GitLab CI'],
  },
  {
    company: 'Upply',
    kind: 'freelance',
    role: 'Front-end',
    period: '2023–24',
    location: 'Levallois-Perret',
    blurb:
      'B2B SaaS for price and capacity forecasting across transport and logistics. Feature work on the Next.js platform and back office, GraphQL on the client via React Query, front-end quality and tests.',
    stack: ['Next.js', 'React', 'React Query', 'GraphQL', 'TypeScript', 'Cypress'],
  },
  {
    company: 'Spectral TMS',
    kind: 'freelance',
    role: 'JS developer',
    period: '2023',
    location: 'Paris',
    blurb:
      'One-month reinforcement on a business-workflow tool: a React workflow module against a Node REST API, iterating quickly with the PM and founders on specs.',
    stack: ['React', 'Node.js', 'TypeScript', 'REST'],
  },
  {
    company: 'Fidesio',
    kind: 'agency',
    role: 'Front-end & fullstack',
    period: '2018–22',
    location: 'Paris',
    blurb:
      'Régie developer at a digital agency / ESN, placed on client missions across the period. Front and fullstack in TypeScript / Node.js, with test setup on the client projects.',
    stack: ['TypeScript', 'Node.js', 'React', 'SvelteKit'],
    missions: [
      {
        client: 'France Télévisions',
        period: '2020–23',
        blurb:
          'Rebuild of the France 3 régions and La 1ère sites, centred on web performance for high-traffic audiences: PWA architecture, Core Web Vitals, bundle and cache work.',
        stack: ['SvelteKit', 'Node.js', 'Symfony', 'PWA'],
        note: 'Final stretch (late 2022–2023) continued as a direct freelance engagement after Fidesio.',
      },
      {
        client: 'N&C',
        period: '2018–19',
        blurb:
          'Front-end on the Revbell and Gaia products, with R&D on data visualisation (d3.js).',
        stack: ['React', 'd3.js', 'JavaScript'],
      },
    ],
  },
  {
    company: 'Liamone Web',
    kind: 'agency',
    role: 'Front-end / fullstack',
    period: '2016–18',
    location: 'Versailles',
    blurb:
      'Digital agency: responsive integration and JavaScript application work (Vue.js, React) across client projects.',
    stack: ['Vue.js', 'React', 'Node.js', 'JavaScript'],
    missions: [
      {
        client: 'Groupe PSA / Citroën',
        period: '2017–18',
        blurb:
          "Citroën marketing site and vehicle configurator: CSS refactor to remove the previous integrator's legacy and cut redundancy on the configurator.",
        stack: ['SCSS', 'jQuery', 'Web perf'],
      },
    ],
  },
]

export const stack = [
  { label: 'Frontend', items: ['SvelteKit', 'Svelte', 'Next.js', 'React', 'TanStack Start', 'TypeScript'] },
  { label: 'Backend', items: ['Node', 'Fastify', 'GraphQL', 'REST'] },
  { label: 'Quality', items: ['Vitest', 'Jest', 'Playwright', 'Cypress', 'Pact', 'MSW', 'Storybook'] },
  { label: 'CI/CD & Ops', items: ['GitLab CI', 'GitHub Actions', 'Docker', 'Vite'] },
  { label: 'Also', items: ['Web Performance', 'i18n', 'SEO', 'Agile'] },
]

export const education = [
  { year: '2016', title: 'WebForce3', detail: 'Web developer / integrator' },
  { year: '2010', title: 'SAE Institute Paris', detail: 'Digital Film & Multimedia' },
]

export const certs = ['TestingJavaScript', 'EpicReact']

export const links = [
  { label: 'Malt', href: 'https://www.malt.fr/profile/jeremienehlil' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-n%C3%A9hlil-36932a41/' },
  { label: 'GitHub', href: 'https://github.com/jeremN' },
]
