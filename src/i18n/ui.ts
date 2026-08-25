// Chrome strings shared by every page: header nav, footer, CTA.
// The nav hrefs are English routes; Layout maps them through ROUTE_MAP for /fr/.
const en = {
  // Five primary destinations, matching the comp minus Stack (dropped: no page
  // backs it). Services now has its own route (the comp's header carries a
  // link for it), so it joins the nav. /freelance predates it and covers
  // overlapping ground; Contact covers the same intent, so /freelance stays
  // reachable only by direct URL rather than through nav or footer.
  nav: [
    { href: '/blog', label: 'Writing' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ],
  // The two landmark labels a screen reader announces on every page. They sat
  // hardcoded in Layout.astro and stayed English under /fr/.
  navLabel: 'Main',
  themeToggleLabel: 'Switch between light and dark theme',
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
  navLabel: 'Principale',
  themeToggleLabel: 'Basculer entre le thème clair et le thème sombre',
  getInTouch: 'Me contacter',
  footerCta: 'Travaillons ensemble',
  basedIn: 'Basé en France',
  remote: 'Travail à distance',
  switchLabel: 'Lire cette page en anglais',
}

export const getUi = (lang: 'en' | 'fr') => (lang === 'fr' ? fr : en)
