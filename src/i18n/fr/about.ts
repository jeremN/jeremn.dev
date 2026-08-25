import type en from '../en/about'

const copy: typeof en = {
  title: 'À propos · Jérémie Néhlil, développeur freelance',
  description:
    'Jérémie Néhlil, développeur freelance fullstack JavaScript près de Paris. SvelteKit, React et Node. Ma façon de travailler et ce que je prends.',
  eyebrow: '03 / À propos',
  headlineBefore: "J'aime les logiciels qui ont ",
  headlineEmphasis: 'du sens.',
  downloadCv: 'Télécharger le CV',
  valuesHeading: 'Ce qui compte pour moi',
  toolsHeading: "Les outils que j'utilise",
  toolsTail: " · et bien d'autres…",
  currentlyHeading: 'En ce moment',
  values: [
    { title: 'Des systèmes simples', body: "Ne construire que le nécessaire. La clarté avant la complexité." },
    { title: 'Du code maintenable', body: "On lit le code plus souvent qu'on ne l'écrit. J'écris pour le moi de demain." },
    { title: 'Des logiciels utiles', body: 'Résoudre de vrais problèmes. Livrer ce qui compte.' },
    { title: 'Apprendre en continu', body: 'Rester curieux. Continuer à apprendre.' },
  ],
  currently: [
    { label: 'Développement', body: 'Mon agentOS personnel, et une agence web IA à part entière.' },
    { label: 'Apprentissage', body: 'Les processus DevOps.' },
    { label: 'Expérimentation', body: 'Les outils IA et la productivité des développeurs.' },
  ],
}

export default copy
