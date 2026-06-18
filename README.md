# jeremn.dev

Jérémie Néhlil's personal website — CV, tech blog, and freelance page. Blog posts
are **markdown files in the repo** (git is the CMS): write an `.mdx` file, commit,
push, and a GitHub Action rebuilds and deploys the static site. The homepage opens
with a signature **WebGL "Brick Milky Way" galaxy hero**.

## Stack

Astro (`output: 'static'`) · Tailwind v4 (`@tailwindcss/vite`) + self-hosted fonts
(`@fontsource-variable/*`) · Astro Content Layer (MDX) · Shiki (`github-dark`) +
`rehype-sanitize` · Three.js (hero, imperative — no framework) · Playwright.
Deployed to **GitHub Pages**.

## Local development

```bash
npm install
npm run dev        # → http://localhost:4321
```

No runtime services, database, or env vars are needed — the whole site prerenders.

```bash
npm run build      # static build → dist/
npm run preview    # serve dist/ locally on :4321
npm run check      # astro check (type-check .astro + TS)
```

## Writing posts

Posts live in `src/content/blog/*.mdx`. Frontmatter is validated at build by the
schema in `src/content.config.ts`:

```mdx
---
title: My post
summary: One-line summary for cards + meta.
tags: [astro, notes]
publishedAt: 2026-06-18
draft: false
---

Body in Markdown / MDX. Fenced code blocks are highlighted by Shiki at build.
```

To publish: add/commit the file and push to `main` — the deploy Action does the rest
(~60s). Set `draft: true` to keep a post out of the build.

## Testing

```bash
npm run test:e2e   # Playwright smoke tests (builds + previews, then asserts)
```

First run only: `npx playwright install chromium` to fetch the browser binary.

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`withastro/action` and publishes to Pages. One-time setup: repo **Settings → Pages →
Source = GitHub Actions**, and point `jeremn.dev` DNS at GitHub Pages
(`public/CNAME` carries the custom domain).

## Notes

- **Security:** agent/author-authored markdown is sanitized (`rehype-sanitize`) at
  build. The custom schema in `astro.config.mjs` preserves Shiki's inline token
  colors while still stripping scripts, event handlers, and disallowed tags.
- **Performance:** the WebGL hero is a client-only Astro island
  (`src/components/hero/`); Three.js never ships to `/blog`, `/cv`, or `/freelance`.
- **Fonts** are self-hosted via `@fontsource-variable/*` — no external font requests.
- `/hero-lab` is an unshipped page comparing six black-hole warp laws side by side.
