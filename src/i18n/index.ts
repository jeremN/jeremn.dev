// The only module that knows a route has a twin in the other language.
// Layout.astro reads it for hreflang, LangSwitch.astro reads it for the switcher.
// Every task that ships a French page adds its pair to ROUTE_MAP.
import enHome from './en/home'
import frHome from './fr/home'
import enServices from './en/services'
import frServices from './fr/services'
import enAbout from './en/about'
import frAbout from './fr/about'
import enContact from './en/contact'
import frContact from './fr/contact'

export const LOCALES = ['en', 'fr'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** English route -> French route. Values are the exact hrefs to emit. */
export const ROUTE_MAP: Record<string, string> = {
  '/': '/fr/',
  '/services': '/fr/services',
  '/about': '/fr/a-propos',
  '/contact': '/fr/contact',
}

/** Drop a trailing slash so '/fr' and '/fr/' resolve to the same entry.
 *  The root keeps its slash: it is the shortest possible route. */
const strip = (route: string): string => (route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route)

const BY_EN = new Map(Object.entries(ROUTE_MAP).map(([en, fr]) => [strip(en), { en, fr }]))
const BY_FR = new Map(Object.entries(ROUTE_MAP).map(([en, fr]) => [strip(fr), { en, fr }]))

export const localeOf = (route: string): Locale => {
  const r = strip(route)
  return r === '/fr' || r.startsWith('/fr/') ? 'fr' : 'en'
}

/** The pair a route belongs to, or null when the route has no twin
 *  (/hero-lab, /cv-print, and any article published in one language only). */
export const alternatesFor = (route: string): { en: string; fr: string } | null =>
  BY_EN.get(strip(route)) ?? BY_FR.get(strip(route)) ?? null

const COPY = {
  en: { home: enHome, services: enServices, about: enAbout, contact: enContact },
  fr: { home: frHome, services: frServices, about: frAbout, contact: frContact },
} as const

export type Page = keyof (typeof COPY)['en']

export const getCopy = <P extends Page>(lang: Locale, page: P): (typeof COPY)['en'][P] =>
  COPY[lang][page] as (typeof COPY)['en'][P]
