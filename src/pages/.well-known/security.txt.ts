import type { APIRoute } from 'astro'

// RFC 9116. Generated at build time rather than dropped in public/, purely for
// the `Expires` field: the RFC requires one, caps it at a year out, and treats
// an expired file as invalid — so a hand-written date silently turns this from
// an asset into a liability. Every deploy re-stamps it from the build clock.
//
// That still rots if the repo goes quiet for six months, so the infra canary
// re-reads this off production and fails while there is time to react. The
// horizon below and the canary's threshold are two halves of one mechanism:
// keep EXPIRY_MONTHS comfortably above the canary's warning window.
const EXPIRY_MONTHS = 6

export const GET: APIRoute = ({ site }) => {
  const expires = new Date()
  expires.setUTCMonth(expires.getUTCMonth() + EXPIRY_MONTHS)
  expires.setUTCHours(0, 0, 0, 0)

  const body =
    [
      `Contact: mailto:security@jeremn.dev`,
      `Expires: ${expires.toISOString()}`,
      `Preferred-Languages: en, fr`,
      `Canonical: ${new URL('/.well-known/security.txt', site)}`,
    ].join('\n') + '\n'

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
