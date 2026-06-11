# jeremn.dev

Jérémie Néhlil's personal website — CV, tech blog, and freelance page — plus a
lightweight content CRM. Blog posts are stored as **markdown rows in a database**
and are writable both by the author and by the author's LLM agents (later phases).
The homepage opens with a signature **WebGL "Brick Milky Way" galaxy hero**.

## Stack

TanStack Start (React, SSR) · Cloudflare Workers · Turso (libSQL) + Drizzle ORM ·
Tailwind v4 + self-hosted fonts (`@fontsource`) · unified/remark/rehype + Shiki ·
Three.js (hero) · Vitest + Playwright.

## Local development

> **Why `turso dev`?** The app's SSR runs in the Cloudflare Workers runtime
> (workerd), which has **no filesystem** — so a `file:` SQLite DB can't be read at
> runtime. Serve the local DB over HTTP instead with `turso dev`. (Node tooling —
> `drizzle-kit`, the seed script — and the tests can use `file:`/`:memory:`.)

```bash
npm install
cp .env.example .env                 # TURSO_DATABASE_URL defaults to http://127.0.0.1:8080

turso dev --db-file local.db         # serves local.db on :8080 — keep running (separate terminal)
npm run db:push                      # apply the schema to local.db (first time)
npm run db:seed                      # seed sample posts (first time)

npm run dev                          # → http://localhost:3000
```

If `turso dev` isn't running, the DB-backed routes (`/blog`) error, but the
homepage hero still renders (it degrades gracefully).

Install the Turso CLI: `brew install tursodatabase/tap/turso` (or see
<https://docs.turso.tech/cli>).

## Testing

```bash
npm test          # Vitest unit tests (markdown pipeline + posts service)
npm run test:e2e  # Playwright smoke tests (needs `turso dev` running for the blog test)
```

## Deploy (Cloudflare Workers + Turso cloud)

1. Create a Turso **cloud** database and get its URL + auth token.
2. Set production secrets:
   - `npx wrangler secret put TURSO_DATABASE_URL` — e.g. `libsql://<your-db>.turso.io`
   - `npx wrangler secret put TURSO_AUTH_TOKEN`
3. Apply migrations to the Turso db (set the same vars locally, then `npm run db:migrate`).
4. Deploy: `npm run deploy` (runs the build + `wrangler deploy`).

## Notes

- **Security:** agent/DB-sourced markdown is sanitized (`rehype-sanitize`) *before*
  Shiki highlights it, server-side at render — see `src/lib/markdown.ts`.
- **Performance:** the WebGL hero is a client-only, code-split island
  (`src/components/hero/`); Three.js (~142 KB gzip) never ships to `/blog` or `/cv`.
- **Fonts** are self-hosted via `@fontsource-variable/*` — no external font requests.
- Shiki uses its **pure-JS regex engine** (no WASM) so highlighting runs in workerd.
