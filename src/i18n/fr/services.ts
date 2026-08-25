import type en from '../en/services'

const copy: typeof en = {
  title: 'Développement web freelance · jeremn.dev',
  description: 'Développement freelance pour les équipes produit, et des systèmes IA cadrés pour le travail répétitif.',
  eyebrow: '06 / Services',
  headlineBefore: 'Des systèmes utiles, ',
  headlineEmphasis: 'construits avec intention.',
  lead: 'Développement freelance pour les équipes produit, et des systèmes IA cadrés pour le travail répétitif.',
  developmentHeading: '01 / Développement',
  developmentTitle: "Six façons d'accompagner une équipe produit.",
  developmentSubtitle: 'Choisissez un audit ciblé, un périmètre de livraison ou un accompagnement technique direct.',
  development: [
    { icon: 'svc-icon-fullstack', title: 'Développement fullstack', copy: "De l'interface au déploiement." },
    { icon: 'svc-icon-frontend', title: 'Développement frontend', copy: 'Des interfaces produit accessibles.' },
    { icon: 'svc-icon-backend', title: 'Backend & APIs', copy: 'Des services stables, aux périmètres clairs.' },
    { icon: 'svc-icon-performance', title: 'Performance & audits', copy: 'Des preuves, des risques et les prochaines étapes.' },
    {
      icon: 'svc-icon-automation',
      title: 'Automatisation & outillage',
      copy: "Des scripts, de l'intégration continue et des outils internes.",
    },
    { icon: 'svc-icon-ai-integration', title: 'Intégration IA', copy: 'Des fonctionnalités utiles, avec des garde-fous.' },
  ],
  aiHeading: '02 / IA & automatisation',
  aiTitle: 'Un système cadré. Un résultat visible.',
  aiSubtitle: 'Cette offre reste distincte du développement freelance sans périmètre défini.',
  ai: [
    {
      icon: 'svc-icon-agent-setup',
      title: "Mise en place d'un agent",
      copy: 'Un agent encadré, avec les bons outils et les bons contrôles.',
    },
    {
      icon: 'svc-icon-workflow-automation',
      title: 'Automatisation de workflow',
      copy: 'Un workflow reproductible, dans les outils que vous utilisez déjà.',
    },
    {
      icon: 'svc-icon-ai-tool-integration',
      title: "Intégration d'un outil IA",
      copy: 'Une fonctionnalité produit, avec recherche documentaire et relecture humaine.',
    },
  ],
  ctaEyebrow: "Prêt quand vous l'êtes",
  ctaHeadline: 'Apportez la contrainte. Je vous aide à définir le travail.',
  ctaLabel: 'Demander un devis',
  quoteSubject: 'Demande de devis',
}

export default copy
