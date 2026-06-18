# AGENTS.md

Guidance for AI agents working in this repo.

## What this is

`jeremn.dev` — a **static Astro site** deployed to GitHub Pages. Git is the CMS:
blog posts are `.mdx` files under `src/content/blog/`. There is no backend, database,
or runtime env — everything prerenders at build.

## Stack

- **Astro** `output: 'static'` (Content Layer for the blog collection)
- **Tailwind v4** via `@tailwindcss/vite` (`@import "tailwindcss"` in `src/styles.css`)
- **Shiki** (`github-dark`) + **`rehype-sanitize`** for markdown (config in `astro.config.mjs`)
- **Three.js** for the hero — plain imperative modules (`*.client.ts`), no React/framework
- Self-hosted fonts via `@fontsource-variable/*`
- **Playwright** for e2e smoke tests

## Layout

- `src/pages/` — routes (`index`, `cv`, `freelance`, `hero-lab`, `blog/`)
- `src/content/blog/*.mdx` — posts (the CMS); schema in `src/content.config.ts`
- `src/layouts/Layout.astro` — shell (header nav + footer CTA)
- `src/components/site/` — `Eyebrow`, `PostCard` (`.astro`)
- `src/components/hero/` — `Hero.astro` island + `galaxy.client.ts` (keep framework-free)
- `src/components/hero-lab/` — `lab.client.ts` + `VARIANTS` for `/hero-lab`

## Commands

```bash
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run check      # astro check (must be 0 errors)
npm run test:e2e   # Playwright smoke (needs `npx playwright install chromium` once)
```

## Conventions

- The WebGL client modules (`galaxy.client.ts`, `lab.client.ts`, their `types.ts`) are
  framework-free imperative Three.js — keep them that way; mount them from an Astro
  `<script>`. Three.js must never reach the static HTML (client island only).
- New markdown is sanitized at build; if you add raw HTML in a post and it disappears,
  the sanitize schema in `astro.config.mjs` stripped it (by design).
- Publishing = commit an `.mdx` post + push to `main`; the Pages Action deploys.
- Keep commits to a single conventional-commit subject line.
