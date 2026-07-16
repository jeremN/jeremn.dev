#!/usr/bin/env bash
#
# Negative tests for the infra canary.
#
# A monitor that has only ever been observed passing is worthless — you cannot
# tell a working check from a check that can never fire. These deliberately
# point the canary at wrong targets and assert that it FAILS.
#
# Run with: bash scripts/infra-canary.test.sh

set -uo pipefail
cd "$(dirname "$0")/.."

fails=0
expect_fail() {
  local name="$1"; shift
  if env "$@" bash scripts/infra-canary.sh >/dev/null 2>&1; then
    printf '  \033[31mBROKEN\033[0m  %s — canary PASSED when it should have failed\n' "$name"
    fails=$((fails + 1))
  else
    printf '  \033[32mok\033[0m      %s — canary correctly failed\n' "$name"
  fi
}

expect_pass() {
  local name="$1"
  if bash scripts/infra-canary.sh >/dev/null 2>&1; then
    printf '  \033[32mok\033[0m      %s — canary passes against real prod\n' "$name"
  else
    printf '  \033[31mBROKEN\033[0m  %s — canary FAILED against real prod\n' "$name"
    fails=$((fails + 1))
  fi
}

echo "Proving the canary can actually fail:"

# A domain that isn't ours: wrong cert issuer, wrong A records.
expect_fail "wrong site (cert issuer + A records)" CANARY_SITE=example.com

# Treat the REAL allowed domain as if it should be blocked. The allowlist check
# must notice it is NOT blocked. This proves check 6 discriminates rather than
# just always finding the string it wants.
expect_fail "allowlist check discriminates" CANARY_BAD_DOMAINS=jeremn.dev

# A worker URL that isn't the relay at all.
expect_fail "wrong worker URL" CANARY_WORKER=https://example.com

# Demand absurd expiry headroom. A 200 on security.txt is easy to get right by
# accident; this proves the check actually parses the date and compares it,
# rather than passing on the mere presence of the file.
expect_fail "security.txt expiry check discriminates" CANARY_SECURITY_TXT_MIN_DAYS=99999

echo
echo "And still green against the real thing:"
expect_pass "production"

echo
if [ "$fails" -eq 0 ]; then
  echo "Canary verified: it fails when it should, and passes when it should."
  exit 0
fi
echo "$fails problem(s) with the canary itself."
exit 1
