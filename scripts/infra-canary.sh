#!/usr/bin/env bash
#
# Infra canary — guards the production setup against silent, delayed regressions.
#
# The failure modes here are dangerous precisely because nothing looks broken
# when they happen:
#
#   * Proxying the DNS records through Cloudflare (orange cloud) keeps the site
#     up today, but GitHub can no longer complete its ACME challenge — so the
#     TLS cert fails to renew ~90 days later, long after anyone remembers
#     touching DNS. A Cloudflare-issued cert is the earliest visible symptom.
#
#   * security.txt carries a mandatory RFC 9116 `Expires` field and is invalid
#     once past it. Nothing breaks, nothing warns — the file just stops counting.
#
# Everything probed here is a public endpoint — no secrets, no tokens.
# Run locally with: bash scripts/infra-canary.sh

set -uo pipefail

# Overridable so the failure paths can actually be exercised — a canary that has
# only ever been seen passing is decorative. See scripts/infra-canary.test.sh.
SITE="${CANARY_SITE:-jeremn.dev}"
PAGES_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"

fails=0
pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fails=$((fails + 1)); }

echo "== 1. site responds over HTTPS =="
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://$SITE/")
if [ "$code" = "200" ]; then pass "https://$SITE -> 200"; else fail "https://$SITE -> $code (expected 200)"; fi

echo "== 2. TLS cert is still issued by Let's Encrypt =="
# If the DNS records get proxied (orange cloud), Cloudflare terminates TLS and
# presents its own cert — and GitHub's cert renewal is already broken by then.
issuer=$(echo | openssl s_client -connect "$SITE:443" -servername "$SITE" 2>/dev/null \
  | openssl x509 -noout -issuer 2>/dev/null)
if echo "$issuer" | grep -q "Let's Encrypt"; then
  pass "issuer is Let's Encrypt"
else
  fail "cert issuer changed -> ${issuer:-<none>}"
  fail "  ^ DNS records are probably PROXIED (orange cloud). They must be DNS-only."
fi

echo "== 3. apex A records still point at GitHub Pages =="
actual=$(python3 -c "
import socket
ips = sorted({ai[4][0] for ai in socket.getaddrinfo('$SITE', 443, socket.AF_INET)})
print(' '.join(ips))
" 2>/dev/null)
expected=$(echo "$PAGES_IPS" | tr ' ' '\n' | sort | tr '\n' ' ' | sed 's/ $//')
if [ "$actual" = "$expected" ]; then
  pass "A records = GitHub Pages ($actual)"
else
  fail "A records drifted"
  fail "  expected: $expected"
  fail "  actual:   ${actual:-<none>}"
fi

echo "== 4. sitemap is served =="
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://$SITE/sitemap-index.xml")
if [ "$code" = "200" ]; then pass "sitemap-index.xml -> 200"; else fail "sitemap-index.xml -> $code"; fi

echo "== 5. security.txt is served and not close to lapsing =="
# The third silent-decay mode, and the only one on a clock nobody sets: RFC 9116
# makes `Expires` mandatory and an expired file INVALID, so this asset rots on
# its own. Every deploy re-stamps it (src/pages/.well-known/security.txt.ts),
# which means the real risk is simply not deploying for months — no push, no
# refresh, no symptom until a would-be reporter finds an invalid file.
MIN_DAYS="${CANARY_SECURITY_TXT_MIN_DAYS:-30}"
sec=$(curl -s --max-time 20 "https://$SITE/.well-known/security.txt")
if echo "$sec" | grep -qi '^Contact:'; then
  pass "security.txt served with a Contact field"
else
  fail "security.txt missing, empty, or has no Contact field"
fi
# Parsed in python3 (already required by check 3): BSD and GNU `date` disagree
# on parsing ISO 8601, and this has to run on both a Mac and ubuntu-latest.
expiry=$(echo "$sec" | grep -i '^Expires:' | head -1 | sed 's/^[Ee]xpires:[[:space:]]*//' | tr -d '\r')
days=$(python3 -c "
import sys, datetime
try:
    e = datetime.datetime.fromisoformat(sys.argv[1].strip().replace('Z', '+00:00'))
    print(int((e - datetime.datetime.now(datetime.timezone.utc)).total_seconds() // 86400))
except Exception:
    pass
" "$expiry" 2>/dev/null)
if [ -n "$days" ] && [ "$days" -ge "$MIN_DAYS" ]; then
  pass "security.txt expires in ${days}d (>= ${MIN_DAYS}d of headroom)"
else
  fail "security.txt expiry is '${expiry:-<none>}' -> ${days:-unparseable} days (need >= $MIN_DAYS)"
  fail "  ^ Push any commit to main to re-stamp it. Left alone it lapses and"
  fail "    the file stops being valid under RFC 9116."
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "All infra checks passed."
  exit 0
fi
echo "$fails check(s) FAILED — see the notes above."
exit 1
