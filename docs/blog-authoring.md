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

### Why a relay is needed at all

GitHub's OAuth flow exchanges a temporary `code` for an access token, and that
exchange must be signed with the app's **client secret**. A secret can't live in
a static page — anyone could read it in View Source. So one small server-side
component does the exchange. That relay is the *only* server in this otherwise
fully-static architecture.

### Setup state — DONE

- **Relay:** <https://sveltia-cms-auth.jeremn-code.workers.dev>
  (from <https://github.com/sveltia/sveltia-cms-auth>, MIT).
- **CMS points at it** via `base_url` in `public/admin/config.yml`.
- **GitHub OAuth App** registered — callback `…workers.dev/callback`.
- **Worker vars set:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (encrypted),
  `ALLOWED_DOMAINS=jeremn.dev`.

Verified: `site_id=jeremn.dev` → 302 to GitHub OAuth; `evil.example`,
`notjeremn.dev`, and `jeremn.dev.evil.com` → `UNSUPPORTED_DOMAIN`.

> **`ALLOWED_DOMAINS` is a security control, not a nicety.** Left unset, the relay
> completes an OAuth exchange for *any* site that calls it — an open relay for
> your GitHub app. The check is anchored (`^…$`), so lookalike domains are
> rejected too.

### Two traps if you ever redeploy the relay

1. **Plain-text vars live in `wrangler.toml`, not just the dashboard.**
   `ALLOWED_DOMAINS` and `GITHUB_CLIENT_ID` are declared in the Worker repo's
   `wrangler.toml` `[vars]` block. A `wrangler deploy` from a *fresh clone* (which
   has no `[vars]`) **wipes them**, silently turning the relay back into an open
   relay. Re-add them, or set them in the dashboard, after any redeploy.
   The client *secret* is a `secret_text` binding and does survive redeploys.

2. **Cloudflare's edge caches the `/auth` 302.** If you probe `/auth` before the
   vars are set, that redirect gets cached for that exact URL and keeps being
   served even after you fix the config — making it look like the allowlist is
   broken when it isn't. Add a throwaway query param (`&cb=<random>`) when
   testing.

`jeremn.dev/admin` works from any browser, including a phone.

## Upgrading Sveltia

The CMS loads from a version-pinned CDN with an integrity hash in
`public/admin/index.html`. To upgrade, bump the version and recompute the hash —
update **both** in the same edit:

```sh
curl -sL https://unpkg.com/@sveltia/cms@<version>/dist/sveltia-cms.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Current pin: `@sveltia/cms@0.167.3`.
