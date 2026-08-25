import type { DoodleName } from '../../components/site/Doodle.astro'

type ServiceItem = { icon: DoodleName; title: string; copy: string }

// This page's own copy, distinct from lib/services.ts (Home's teaser grid and
// /freelance's fuller list): the validated comp writes each line as a short,
// parallel offer statement, a different voice than the existing blurbs.
const development: ServiceItem[] = [
  { icon: 'svc-icon-fullstack', title: 'Full-stack development', copy: 'Interface to deployment.' },
  { icon: 'svc-icon-frontend', title: 'Frontend development', copy: 'Accessible product interfaces.' },
  { icon: 'svc-icon-backend', title: 'Backend & APIs', copy: 'Stable services and boundaries.' },
  { icon: 'svc-icon-performance', title: 'Performance & audits', copy: 'Evidence, risks, and next steps.' },
  { icon: 'svc-icon-automation', title: 'Automation & tooling', copy: 'Scripts, CI, and internal tools.' },
  { icon: 'svc-icon-ai-integration', title: 'AI integration', copy: 'Useful features with controls.' },
]

const ai: ServiceItem[] = [
  { icon: 'svc-icon-agent-setup', title: 'Agent setup', copy: 'A governed agent with the correct tools and checks.' },
  {
    icon: 'svc-icon-workflow-automation',
    title: 'Workflow automation',
    copy: 'A repeatable workflow across the tools you already use.',
  },
  {
    icon: 'svc-icon-ai-tool-integration',
    title: 'AI tool integration',
    copy: 'A product feature with retrieval and human review.',
  },
]

export default {
  title: 'Services · jeremn.dev',
  description: 'Freelance engineering for product teams, plus scoped AI systems for repetitive work.',
  eyebrow: '06 / Services',
  headlineBefore: 'Useful systems, ',
  headlineEmphasis: 'built with intent.',
  lead: 'Freelance engineering for product teams, plus scoped AI systems for repetitive work.',
  developmentHeading: '01 / Development',
  developmentTitle: 'Six ways I can support a product team.',
  developmentSubtitle: 'Choose a focused audit, a delivery scope, or hands-on engineering support.',
  development,
  aiHeading: '02 / AI & automation',
  aiTitle: 'One scoped system. One visible outcome.',
  aiSubtitle: 'The offer stays separate from open-ended freelance development.',
  ai,
  ctaEyebrow: 'Ready when you are',
  ctaHeadline: 'Bring the constraint. I will help define the work.',
  ctaLabel: 'Request a quote',
  quoteSubject: 'Project quote',
}
