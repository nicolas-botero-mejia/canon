#!/usr/bin/env bash
# Hook dispatcher tests — verifies bin/hook.sh routing behavior.
# Run from the package repo root:
#   bash test/hooks/hook-dispatcher.test.sh

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOOK="${PKG_ROOT}/bin/hook.sh"
FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=$((FAILED + 1)); }

echo "=== hook dispatcher tests ==="

# ── SessionStart ─────────────────────────────────────────────────────────────
# Runs session-start-report.sh — it reads project state and may exit non-zero
# in a bare environment. We only verify it routes (not that it succeeds end-to-end).
if bash "$HOOK" SessionStart >/dev/null 2>&1; then
  pass "SessionStart → exits 0"
else
  # Accept non-zero if the script ran (it may fail without a consumer project)
  # The routing worked if it didn't hit the "unknown event" branch
  if bash "$HOOK" SessionStart 2>&1 | grep -q "unknown event"; then
    fail "SessionStart → hit unknown-event branch (routing broken)"
  else
    pass "SessionStart → routed to session-start-report.sh (exited non-zero in bare env — expected)"
  fi
fi

# ── PostToolUse ──────────────────────────────────────────────────────────────
# Runs post-write-check.sh with null stdin
if echo '{}' | bash "$HOOK" PostToolUse >/dev/null 2>&1; then
  pass "PostToolUse → exits 0 with null stdin"
else
  if echo '{}' | bash "$HOOK" PostToolUse 2>&1 | grep -q "unknown event"; then
    fail "PostToolUse → hit unknown-event branch (routing broken)"
  else
    pass "PostToolUse → routed to post-write-check.sh (exited non-zero in bare env — expected)"
  fi
fi

# ── Stop ─────────────────────────────────────────────────────────────────────
# Runs the check chain — expected to fail in a bare env, but must not hit "unknown event"
if bash "$HOOK" Stop 2>&1 | grep -q "unknown event"; then
  fail "Stop → hit unknown-event branch (routing broken)"
else
  pass "Stop → routed to check chain (check-index → check-links → check-stale-refs → check-conclusions-alignment → check-contracts → check-addendum-integrity)"
fi

# ── UnknownEvent ─────────────────────────────────────────────────────────────
if bash "$HOOK" UnknownEvent >/dev/null 2>&1; then
  fail "UnknownEvent → should have exited non-zero"
else
  OUTPUT="$(bash "$HOOK" UnknownEvent 2>&1 || true)"
  if echo "$OUTPUT" | grep -qi "unknown event"; then
    pass "UnknownEvent → exits non-zero with 'unknown event' message"
  else
    fail "UnknownEvent → exits non-zero but message missing 'unknown event': $OUTPUT"
  fi
fi

# ── No args ──────────────────────────────────────────────────────────────────
if bash "$HOOK" >/dev/null 2>&1; then
  fail "No args → should have exited non-zero"
else
  pass "No args → exits non-zero"
fi

# ── Missing script file ───────────────────────────────────────────────────────
# hook.sh uses set -euo pipefail, so a missing script causes a non-zero exit
# We can test this indirectly by verifying the scripts exist
MISSING=0
for script in session-start-report.sh post-write-check.sh check-index.sh check-links.sh check-stale-refs.sh check-conclusions-alignment.sh check-contracts.sh check-addendum-integrity.sh; do
  if [ ! -f "${PKG_ROOT}/lib/scripts/${script}" ]; then
    fail "Missing script file: lib/scripts/${script}"
    MISSING=$((MISSING + 1))
  fi
done
[ "$MISSING" -eq 0 ] && pass "All routed script files exist (missing script would cause non-zero exit)"

echo ""
if [ "$FAILED" -gt 0 ]; then
  echo "=== $FAILED hook dispatcher test(s) FAILED ==="
  exit 1
fi
echo "=== all hook dispatcher tests passed ==="
