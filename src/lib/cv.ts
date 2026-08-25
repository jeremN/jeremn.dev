// Single source of truth for the CV. `/about` reads the profile and the stack;
// `/cv-print` and `/fr/cv-print` render the full sheet, and the two PDFs come
// from those pages. After editing this file, regenerate both with
// `npm run cv:pdf`. public/cv.pdf and public/cv-fr.pdf are committed artifacts
// and otherwise go stale.
import type { Locale } from '../i18n'

/**
 * A CV string that differs between the two languages.
 *
 * Both halves are required. A translator cannot forget one: the type fails
 * `npm run check` before the French sheet can print an English sentence. The
 * fields that stay plain `string` are the ones no language changes, such as a
 * company name, a city, a date range, or a tool in a stack list.
 */
type Localised = { en: string; fr: string }
const say = (value: Localised, lang: Locale): string => value[lang]

export const profile = {
  name: 'Jérémie Néhlil',
  title: 'Senior fullstack JavaScript engineer',
  lead: 'Senior fullstack JavaScript engineer. Frontends in SvelteKit, Next.js, React and TanStack Start, plus the Node backends behind them. Shipping for product teams and agencies since 2016.',
  location: 'Near Paris (Sorel-Moussel), France',
  languages: 'French (native), English (professional)',
  email: 'jeremie.nehlil.freelance@proton.me',
}

// The French twin. The email is identical in both: it is not a copy-paste slip.
const profileFr: typeof profile = {
  name: 'Jérémie Néhlil',
  title: 'Développeur fullstack JavaScript senior',
  lead: "Développeur fullstack JavaScript senior. Des interfaces en SvelteKit, Next.js, React et TanStack Start, et les backends Node derrière. Je livre pour des équipes produit et des agences depuis 2016.",
  location: 'Près de Paris (Sorel-Moussel), France',
  languages: 'Français (langue maternelle), anglais (professionnel)',
  email: 'jeremie.nehlil.freelance@proton.me',
}

export const getProfile = (lang: Locale) => (lang === 'fr' ? profileFr : profile)

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
  /** True on the engagement still running. The sheet appends its own word for
   *  "present", so the open-ended range needs no second copy per language. */
  current?: boolean
  location?: string
  blurb: string
  stack: string[]
  missions?: Mission[]
}

/** The same shapes before a language is chosen. `getExperiences` resolves them. */
type SourceMission = Omit<Mission, 'blurb' | 'note'> & { blurb: Localised; note?: Localised }
type SourceExperience = Omit<Experience, 'blurb' | 'role' | 'missions'> & {
  role: Localised
  blurb: Localised
  missions?: SourceMission[]
}

// One list, both languages. Writing the French CV as a second array would let
// the two drift: an experience added to one and not the other prints a shorter
// sheet in that language, and nothing fails. Here a missing translation is a
// type error, and the two sheets cannot differ in length at all.
const EXPERIENCES: SourceExperience[] = [
  {
    company: 'ViaMichelin',
    kind: 'freelance',
    role: { en: 'Senior fullstack', fr: 'Fullstack senior' },
    period: '2024–',
    current: true,
    location: 'Boulogne-Billancourt',
    blurb: {
      en: 'Progressive rebuild of the public ViaMichelin site (mapping, routing, related services) within a 14-person product team. SvelteKit + Svelte 5 front on a Fastify GraphQL BFF; Pact contract testing and a Testing-Trophy strategy against silent integration regressions.',
      fr: "Refonte progressive du site public ViaMichelin (cartographie, calcul d'itinéraire, services associés), dans une équipe produit de 14 personnes. Front SvelteKit + Svelte 5 sur un BFF Fastify GraphQL. Contract testing avec Pact et une stratégie Testing Trophy contre les régressions d'intégration silencieuses.",
    },
    stack: ['SvelteKit', 'Svelte 5', 'Fastify', 'GraphQL', 'Playwright', 'Pact', 'GitLab CI'],
  },
  {
    company: 'Upply',
    kind: 'freelance',
    role: { en: 'Front-end', fr: 'Front-end' },
    period: '2023–24',
    location: 'Levallois-Perret',
    blurb: {
      en: 'B2B SaaS for price and capacity forecasting across transport and logistics. Feature work on the Next.js platform and back office, GraphQL on the client via React Query, front-end quality and tests.',
      fr: "SaaS B2B de prévision des prix et des capacités dans le transport et la logistique. Développement de fonctionnalités sur la plateforme Next.js et le back office. GraphQL côté client via React Query, qualité et tests front-end.",
    },
    stack: ['Next.js', 'React', 'React Query', 'GraphQL', 'TypeScript', 'Cypress'],
  },
  {
    company: 'Spectral TMS',
    kind: 'freelance',
    role: { en: 'JS developer', fr: 'Développeur JS' },
    period: '2023',
    location: 'Paris',
    blurb: {
      en: 'One-month reinforcement on a business-workflow tool: a React workflow module against a Node REST API, iterating quickly with the PM and founders on specs.',
      fr: "Renfort d'un mois sur un outil de workflow métier : un module de workflow React sur une API REST Node. Itérations rapides sur les specs avec le PM et les fondateurs.",
    },
    stack: ['React', 'Node.js', 'TypeScript', 'REST'],
  },
  {
    company: 'Fidesio',
    kind: 'agency',
    role: { en: 'Front-end & fullstack', fr: 'Front-end et fullstack' },
    period: '2018–22',
    location: 'Paris',
    blurb: {
      en: 'Régie developer at a digital agency / ESN, placed on client missions across the period. Front and fullstack in TypeScript / Node.js, with test setup on the client projects.',
      fr: "Développeur en régie dans une agence digitale / ESN, placé sur des missions clients sur toute la période. Front et fullstack en TypeScript / Node.js, avec le setup des tests sur les projets clients.",
    },
    stack: ['TypeScript', 'Node.js', 'React', 'SvelteKit'],
    missions: [
      {
        client: 'France Télévisions',
        period: '2020–23',
        blurb: {
          en: 'Rebuild of the France 3 régions and La 1ère sites, centred on web performance for high-traffic audiences: PWA architecture, Core Web Vitals, bundle and cache work.',
          fr: "Refonte des sites France 3 régions et La 1ère, centrée sur la web performance pour des audiences à fort trafic : architecture PWA, Core Web Vitals, travail sur les bundles et le cache.",
        },
        stack: ['SvelteKit', 'Node.js', 'Symfony', 'PWA'],
        note: {
          en: 'Final stretch (late 2022–2023) continued as a direct freelance engagement after Fidesio.',
          fr: "La dernière ligne droite (fin 2022–2023) s'est poursuivie en freelance direct, après Fidesio.",
        },
      },
      {
        client: 'N&C',
        period: '2018–19',
        blurb: {
          en: 'Front-end on the Revbell and Gaia products, with R&D on data visualisation (d3.js).',
          fr: "Front-end sur les produits Revbell et Gaia, avec de la R&D sur la data visualisation (d3.js).",
        },
        stack: ['React', 'd3.js', 'JavaScript'],
      },
    ],
  },
  {
    company: 'Liamone Web',
    kind: 'agency',
    role: { en: 'Front-end / fullstack', fr: 'Front-end / fullstack' },
    period: '2016–18',
    location: 'Versailles',
    blurb: {
      en: 'Digital agency: responsive integration and JavaScript application work (Vue.js, React) across client projects.',
      fr: "Agence digitale : intégration responsive et développement d'applications JavaScript (Vue.js, React) sur les projets clients.",
    },
    stack: ['Vue.js', 'React', 'Node.js', 'JavaScript'],
    missions: [
      {
        client: 'Groupe PSA / Citroën',
        period: '2017–18',
        blurb: {
          en: "Citroën marketing site and vehicle configurator: CSS refactor to remove the previous integrator's legacy and cut redundancy on the configurator.",
          fr: "Site marketing Citroën et configurateur de véhicules : refactoring CSS pour retirer l'héritage de l'intégrateur précédent et réduire la redondance sur le configurateur.",
        },
        stack: ['SCSS', 'jQuery', 'Web perf'],
      },
    ],
  },
]

export const getExperiences = (lang: Locale): Experience[] =>
  EXPERIENCES.map((e) => ({
    ...e,
    role: say(e.role, lang),
    blurb: say(e.blurb, lang),
    missions: e.missions?.map((m) => ({
      ...m,
      blurb: say(m.blurb, lang),
      note: m.note && say(m.note, lang),
    })),
  }))

// The items are product names and stay as they are. Only the group heading is
// prose, so only it carries a pair.
const STACK: { label: Localised; items: string[] }[] = [
  { label: { en: 'Frontend', fr: 'Frontend' }, items: ['SvelteKit', 'Svelte', 'Next.js', 'React', 'TanStack Start', 'TypeScript'] },
  { label: { en: 'Backend', fr: 'Backend' }, items: ['Node', 'Fastify', 'GraphQL', 'REST'] },
  { label: { en: 'Quality', fr: 'Qualité' }, items: ['Vitest', 'Jest', 'Playwright', 'Cypress', 'Pact', 'MSW', 'Storybook'] },
  { label: { en: 'CI/CD & Ops', fr: 'CI/CD et ops' }, items: ['GitLab CI', 'GitHub Actions', 'Docker', 'Vite'] },
  { label: { en: 'Also', fr: 'Divers' }, items: ['Web Performance', 'i18n', 'SEO', 'Agile'] },
]

export const getStack = (lang: Locale) => STACK.map((g) => ({ label: say(g.label, lang), items: g.items }))

/** `/about` lists the tools only, so it needs no language. */
export const stack = STACK.map((g) => ({ items: g.items }))

// The school names are proper nouns. Only what the course was called in plain
// words gets a translation.
const EDUCATION: { year: string; title: string; detail: Localised }[] = [
  { year: '2016', title: 'WebForce3', detail: { en: 'Web developer / integrator', fr: 'Développeur / intégrateur web' } },
  { year: '2010', title: 'SAE Institute Paris', detail: { en: 'Digital Film & Multimedia', fr: 'Digital Film & Multimedia' } },
]

export const getEducation = (lang: Locale) => EDUCATION.map((e) => ({ ...e, detail: say(e.detail, lang) }))

export const certs = ['TestingJavaScript', 'EpicReact']

export const links = [
  { label: 'Malt', href: 'https://www.malt.fr/profile/jeremienehlil' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-n%C3%A9hlil-36932a41/' },
  { label: 'GitHub', href: 'https://github.com/jeremN' },
]
