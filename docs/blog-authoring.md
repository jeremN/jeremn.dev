# Blog authoring

This site is git-as-source: every post is an `.mdx` file in `src/content/blog/`.
You can write posts three ways — pick whatever's at hand.

## 1. In your editor (no CMS)

Create `src/content/blog/<slug>.mdx`. The filename (minus extension) becomes the
URL: `<slug>` → `/blog/<slug>`. Frontmatter must match the schema:

```mdx
---
title: My new post
summary: One line that shows as the standfirst and in listings.
publishedAt: 2026-06-18
tags: [Astro, Notes]
draft: false
---

Body in Markdown. Fenced code blocks get Shiki highlighting.
```

`summary`, `tags`, and `draft` are optional (default `''`, `[]`, `false`).
`draft: true` keeps a post out of the built site until you flip it.

## 2. Locally with the Sveltia UI

A form-based editor over the same local files — handy for a preview and the
media picker without committing.

```sh
npm run dev           # then open http://localhost:4321/admin
```

On the login screen click **Work with Local Repository** and pick the
`jeremn.dev` folder when prompted. Sveltia reads and writes your working tree
directly through the browser's File System Access API — no GitHub login, no
proxy. (`local_backend: true` in `public/admin/config.yml` enables this; it only
activates on localhost. Requires a Chromium-based browser; for others, fall back
to method 1.)

## 3. From anywhere, on the live site (`jeremn.dev/admin`)

This needs the one-time OAuth setup below. Once done, open `jeremn.dev/admin`
on any device (including a phone), sign in with GitHub, write, and publish — the
CMS commits the `.mdx` to `main` and the deploy Action rebuilds the site.

Write access is gated by GitHub repo permissions: only a collaborator can
commit, so the public `/admin` page is safe.

### One-time setup (Phase 2 — needs your GitHub + Cloudflare accounts)

1. **Deploy the OAuth relay.** From <https://github.com/sveltia/sveltia-cms-auth>,
   deploy to Cloudflare Workers (one-click button, or `wrangler deploy`). Note the
   URL: `https://sveltia-cms-auth.<subdomain>.workers.dev`.
2. **Register a GitHub OAuth App** (Settings → Developer settings → OAuth Apps):
   - Authorization callback URL: `<worker-url>/callback`
   - Generate a client secret; copy the **Client ID** and **Client Secret**.
3. **Set Worker variables** (Workers → your service → Settings → Variables):
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET` (use Encrypt)
   - `ALLOWED_DOMAINS` = `jeremn.dev`
4. **Point the CMS at the relay.** In `public/admin/config.yml`, replace
   `BASE_URL_PLACEHOLDER` with the worker URL, then commit.

`jeremn.dev/admin` now works from any browser.

## Upgrading Sveltia

The CMS loads from a version-pinned CDN with an integrity hash in
`public/admin/index.html`. To upgrade, bump the version and recompute the hash —
update **both** in the same edit:

```sh
curl -sL https://unpkg.com/@sveltia/cms@<version>/dist/sveltia-cms.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Current pin: `@sveltia/cms@0.167.3`.
