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

# ── Stop banner emission ──────────────────────────────────────────────────────
# Stage a minimal consumer with a deliberate check-index violation: a findings/
# file with no CONTENT_INDEX.md. Run the Stop hook from that dir and verify the
# advisory banner JSON is emitted correctly (the hand-rolled awk escaping is tested).
STAGED=$(mktemp -d)
mkdir -p "$STAGED/findings"
printf "# Results\n\nTest results file.\n" > "$STAGED/findings/phase-01-poc-01-results.md"
# No CONTENT_INDEX.md → check-index exits 2 → banner fires

BANNER=$(cd "$STAGED" && bash "$HOOK" Stop 2>/dev/null)
if [[ -z "$BANNER" ]]; then
  fail "Stop → no banner output (expected JSON when check-index fails)"
else
  if echo "$BANNER" | grep -q '"suppressOutput": true' && echo "$BANNER" | grep -q '"systemMessage"'; then
    pass "Stop → banner JSON emitted (suppressOutput=true, systemMessage present)"
  else
    fail "Stop → banner output missing expected fields: $BANNER"
  fi
  # Verify the JSON is syntactically parseable (tests the awk escaping)
  if command -v python3 >/dev/null 2>&1; then
    if echo "$BANNER" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
      pass "Stop → banner JSON is syntactically valid (awk escaping correct)"
    else
      fail "Stop → banner JSON is malformed: $BANNER"
    fi
  else
    pass "Stop → banner JSON parse skipped (python3 not available)"
  fi
fi
rm -rf "$STAGED"

# Advisory contract: the hook always exits 0, even with check failures
STAGED2=$(mktemp -d)
mkdir -p "$STAGED2/findings"
printf "# Results\n\nTest.\n" > "$STAGED2/findings/phase-01-poc-01-results.md"
(cd "$STAGED2" && bash "$HOOK" Stop >/dev/null 2>&1)
BANNER_EXIT=$?
rm -rf "$STAGED2"
if [[ "$BANNER_EXIT" -eq 0 ]]; then
  pass "Stop → exits 0 even when checks fail (advisory contract)"
else
  fail "Stop → unexpected non-zero exit ($BANNER_EXIT) — advisory contract violated"
fi

# ── Stop WARN tier ────────────────────────────────────────────────────────────
# Stage a consumer with a WARN condition: a Complete conclusion missing its
# alignment date. check-conclusions-alignment exits 0 (advisory by design) but
# emits ⚠ to stdout. The banner must surface it in the "Advisory only" section —
# this was the G2 gap where WARN was swallowed because the hook only read exit codes.
STAGED3=$(mktemp -d)
mkdir -p "$STAGED3/conclusions"
printf "**Status:** Complete\n\n**Alignment verified:**\n\nConclusion body.\n" \
  > "$STAGED3/conclusions/phase-01-poc-01-conclusions.md"

WARN_BANNER=$(cd "$STAGED3" && bash "$HOOK" Stop 2>/dev/null)
rm -rf "$STAGED3"

if [[ -z "$WARN_BANNER" ]]; then
  fail "Stop WARN → no banner output (WARN tier swallowed — G2 regression)"
else
  if echo "$WARN_BANNER" | grep -q 'Advisory only'; then
    pass "Stop WARN → banner contains 'Advisory only' section (WARN tier surfaced)"
  else
    fail "Stop WARN → banner missing 'Advisory only' section: $WARN_BANNER"
  fi
  if echo "$WARN_BANNER" | grep -q 'alignment verification'; then
    pass "Stop WARN → banner names the check-conclusions-alignment advisory"
  else
    fail "Stop WARN → banner missing alignment label: $WARN_BANNER"
  fi
  if command -v python3 >/dev/null 2>&1; then
    if echo "$WARN_BANNER" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
      pass "Stop WARN → banner JSON is syntactically valid"
    else
      fail "Stop WARN → banner JSON is malformed: $WARN_BANNER"
    fi
  fi
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
