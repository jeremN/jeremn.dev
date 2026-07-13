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

### Setup state

- ✅ **Relay deployed:** <https://sveltia-cms-auth.jeremn-code.workers.dev>
  (from <https://github.com/sveltia/sveltia-cms-auth>, MIT).
- ✅ **CMS pointed at it:** `base_url` in `public/admin/config.yml`.
- ⬜ **GitHub OAuth App** — see below.
- ⬜ **Worker variables** — see below.

**Register a GitHub OAuth App** — Settings → Developer settings → OAuth Apps →
New OAuth App:

| Field | Value |
| --- | --- |
| Application name | `jeremn.dev CMS` |
| Homepage URL | `https://jeremn.dev` |
| Authorization callback URL | `https://sveltia-cms-auth.jeremn-code.workers.dev/callback` |

Generate a client secret, then copy the **Client ID** and **Client Secret**.

**Set the Worker variables** — Cloudflare dashboard → Workers & Pages →
`sveltia-cms-auth` → Settings → Variables and Secrets:

| Name | Value | Type |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | the Client ID | Text |
| `GITHUB_CLIENT_SECRET` | the Client Secret | **Secret** (encrypted) |
| `ALLOWED_DOMAINS` | `jeremn.dev` | Text |

> **`ALLOWED_DOMAINS` is a security control, not a nicety.** Left unset, the
> relay will complete an OAuth exchange for *any* site that calls it, turning it
> into an open relay for your GitHub app. It must be set.

Deploying a new version of the Worker does **not** clear these — secrets and vars
persist across `wrangler deploy`.

`jeremn.dev/admin` then works from any browser, including a phone.

## Upgrading Sveltia

The CMS loads from a version-pinned CDN with an integrity hash in
`public/admin/index.html`. To upgrade, bump the version and recompute the hash —
update **both** in the same edit:

```sh
curl -sL https://unpkg.com/@sveltia/cms@<version>/dist/sveltia-cms.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Current pin: `@sveltia/cms@0.167.3`.
