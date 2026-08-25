// Chrome strings shared by every page: header nav, footer, CTA.
// The nav hrefs are English routes; Layout maps them through ROUTE_MAP for /fr/.
const en = {
  nav: [
    { href: '/blog', label: 'Writing' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ],
  getInTouch: 'Get in touch',
  footerCta: 'Work with me',
  basedIn: 'Based in France',
  remote: 'Remote friendly',
  switchLabel: 'Read this page in French',
}

const fr: typeof en = {
  nav: [
    { href: '/blog', label: 'Articles' },
    { href: '/about', label: 'À propos' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ],
  getInTouch: 'Me contacter',
  footerCta: 'Travaillons ensemble',
  basedIn: 'Basé en France',
  remote: 'Travail à distance',
  switchLabel: 'Lire cette page en anglais',
}

export const getUi = (lang: 'en' | 'fr') => (lang === 'fr' ? fr : en)
