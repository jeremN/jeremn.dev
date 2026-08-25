# jeremn.dev

Jérémie Néhlil's personal website: CV, tech blog, services and freelance page, in
English and French. Blog posts are **markdown files in the repo** (git is the CMS):
write an `.mdx` file, commit, push, and a GitHub Action rebuilds and deploys the
static site. Illustrations across the site are hand-drawn SVG, built from the
Xiaohei mascot set.

## Stack

Astro (`output: 'static'`, native i18n) · Tailwind v4 (`@tailwindcss/vite`) +
self-hosted fonts (`@fontsource-variable/*`) · Astro Content Layer (MDX) · Shiki
(`github-dark`) + `rehype-sanitize` · `@astrojs/rss` + `@astrojs/sitemap` ·
Playwright. Deployed to **GitHub Pages**.

Three.js is still a dependency, but it ships to one unlisted page only. See
[Retired work](#retired-work).

## Local development

```bash
npm install
npm run dev        # → http://localhost:4321
```

No runtime services, database, or env vars are needed. The whole site prerenders.

```bash
npm run build      # static build → dist/
npm run preview    # serve dist/ locally on :4321
npm run check      # astro check (type-check .astro + TS)
npm run og         # re-render the social cards into public/og/
npm run cv:pdf     # re-render the printable CV
```

## Two languages

English is served from the root, French from `/fr/`. Astro's i18n is configured with
`defaultLocale: 'en'` and `prefixDefaultLocale: false`, so no English URL carries a
locale prefix.

`src/i18n/index.ts` is the only module that knows a route has a twin. It holds
`ROUTE_MAP` (`/about` ↔ `/fr/a-propos`), `alternatesFor`, and `getCopy(lang, page)`.
Copy lives in `src/i18n/{en,fr}/<page>.ts`, and each French file is typed
`const copy: typeof en = {...}`, so a missing key fails `npm run check` instead of
rendering an English string on a French page.

Page markup sits in `src/components/pages/`. Everything under `src/pages/` is a thin
wrapper that picks a language and renders one of those components.

To add a French page: write `src/i18n/fr/<page>.ts`, add the route pair to
`ROUTE_MAP`, and add the wrapper under `src/pages/fr/`. The language switcher and the
`hreflang` tags follow on their own.

## Writing posts

Posts live in `src/content/blog/*.mdx`, flat, both languages together. Frontmatter is
validated at build by the schema in `src/content.config.ts`:

```mdx
---
title: My post
summary: The blurb a reader sees on the blog index and under the title. Free to run long.
description: The meta description and the JSON-LD description. Between 70 and 160 characters.
publishedAt: 2026-06-18
tags: [astro, notes]
draft: false
lang: 'en'
translationKey: 'my-post'
---

Body in Markdown / MDX. Fenced code blocks are highlighted by Shiki at build.
```

`summary` and `description` are two fields on purpose. `summary` is written for a
reader browsing the index; `description` is written for a search result, and the
schema rejects it past 160 characters, where Google truncates.

`translationKey` pairs an article with its translation, and is required: an article
with no key can never be paired, and a silent gap there is what produces broken
`hreflang`. A translation carries the **English slug** as its `translationKey`, while
its own filename comes from the French title. Both articles then share one
illustration, which `src/lib/article-illustrations.ts` looks up by key.

To publish: add, commit and push to `main`. The deploy Action does the rest (~60s).
Set `draft: true` to keep a post out of the build.

## SEO

Five surfaces, all generated:

- **JSON-LD.** `src/lib/structured-data.ts` builds every block, `JsonLd.astro` renders
  it. `WebSite` on the home pages, `ProfessionalService` on Services, `Person` on
  About, `BlogPosting` on every article.
- **Social cards.** `/og/[slug]` is a real page, screenshotted by `npm run og` into
  `public/og/`, so a card inherits the live design system rather than redrawing it.
  Re-run it after adding an article or changing the card design.
- **Feeds.** `/rss.xml` and `/fr/rss.xml`, one locale each, both advertised in every
  page's head.
- **Sitemap.** Both trees, with `lastmod` on articles only.
- **`hreflang`.** Reciprocal on every page pair, hand-written from `ROUTE_MAP`.

`pageUrl` in `src/lib/base.ts` is the only way a page names itself. The canonical
link, both `hreflang` tags, `og:url` and every JSON-LD `url` and `@id` go through it,
so all of them name the one URL that answers directly. Use `absolute` for a file,
which never takes a trailing slash.

## Testing

```bash
npm run test:e2e   # Playwright (builds + previews, then asserts)
```

First run only: `npx playwright install chromium` to fetch the browser binary.

The suite runs against the **production build**, not the dev server, so it sees the
real CSS and the real head. Two rules the specs are written to:

- An e2e test lives on the browser's side, not the file's. Assert what the page
  renders, not what the source says. A CSS `text-transform` is invisible to
  `textContent`, and a responsive layout can duplicate the element you located.
- A test that loops over an empty list cannot fail. Sweeps assert their own corpus is
  non-empty, and a rule with no subject uses `test.skip` so it reports as skipped
  rather than passing green.

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`withastro/action` and publishes to Pages. One-time setup: repo **Settings → Pages →
Source = GitHub Actions**, and point `jeremn.dev` DNS at GitHub Pages (`public/CNAME`
carries the custom domain). Cloudflare serves DNS only: turning the proxy on breaks
the certificate.

## Notes

- **The email address is never visible text.** A `mailto:` href is the only place it
  may live, and e2e tests hold that on every page. `/cv-print` is the one deliberate
  exception: it is a printable CV, `noindex`, and excluded from the sitemap.
- **Security:** author-written markdown is sanitized (`rehype-sanitize`) at build. The
  custom schema in `astro.config.mjs` preserves Shiki's inline token colors while
  still stripping scripts, event handlers, and disallowed tags. `serialiseLd` covers
  the path `rehype-sanitize` cannot reach: it escapes `<` in every JSON-LD block, so
  an article headline holding `</script>` cannot close the tag early.
- **Fonts** are self-hosted via `@fontsource-variable/*`. No external font requests.
- **`scripts/infra-canary.sh`** checks the live DNS, certificate and headers, and has
  its own test file next to it.

## Retired work

`/hero-lab` and `/hero-lab/galaxy` are unlisted pages that keep earlier designs
runnable: the WebGL "Brick Milky Way" galaxy hero the home page used before the
Xiaohei illustrations, and a comparison of six black-hole warp laws. Both are
`noindex` and excluded from the sitemap. They are the only reason `three` is still a
dependency, and they never ship to any listed page.
