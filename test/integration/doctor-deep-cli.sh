#!/usr/bin/env bash
# Integration test: canon doctor --deep CLI output.
#
# Unlike doctor-deep.test.mjs (which imports runContentChecks() directly), this
# test runs the real CLI entry point and asserts the printed stdout. It catches
# regressions in the formatting layer that unit tests can't see — e.g. a refactor
# that breaks the ✓/⚠/✗ symbols while runContentChecks() stays correct.
#
# Three scenarios:
#   1. clean-populated consumer  → all checks ✓, exit 0
#   2. WARN consumer             → ⚠ on conclusions-alignment, exit 0
#   3. FAIL consumer             → ✗ on check-contracts, exit 1
#
# Run from the package repo root:
#   bash test/integration/doctor-deep-cli.sh

set -euo pipefail

PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLI="$PKG/bin/cli.mjs"
CLEAN_FIXTURE="$PKG/test/fixtures/clean-populated"
FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=$(( FAILED + 1 )); }

echo "=== doctor --deep CLI integration tests ==="

# ── Stage a fully-wired consumer from a fixture ──────────────────────────────
# Real wiring via `canon init` — doctor validates wiring *integrity* (issue #15:
# vendored content hashes, hooks blocks, .agents/skills resolution, user dirs),
# so hand-rolled stubs no longer pass. The fixture content is overlaid after
# (its CONTENT_INDEX replaces the init seed; the fixture has no CLAUDE.md, so
# init's @import skeleton survives).
stage_consumer() {
  local fixture="${1:-$CLEAN_FIXTURE}"
  local dir
  dir=$(mktemp -d)

  ( cd "$dir" && node "$CLI" init --yes >/dev/null 2>&1 )

  # Overlay content from fixture
  cp -r "${fixture}/." "$dir/"

  # Wiring: node_modules symlink pointing at the package under test
  mkdir -p "$dir/node_modules/@nicolas-botero-mejia"
  ln -s "$PKG" "$dir/node_modules/@nicolas-botero-mejia/canon"

  # Rewrite CONTENT_INDEX.md last to neutralise mtime WARN (same trick as doctor-deep.test.mjs)
  local idx="$dir/CONTENT_INDEX.md"
  if [[ -f "$idx" ]]; then
    local content
    content=$(cat "$idx")
    printf '%s' "$content" > "$idx"
  fi

  echo "$dir"
}

# ─── Scenario 1: clean-populated → all content checks ✓, exit 0 ─────────────

STAGED=$(stage_consumer "$CLEAN_FIXTURE")
OUTPUT=$(cd "$STAGED" && node "$CLI" doctor --deep 2>&1) || true
EXIT_CODE=$(cd "$STAGED" && node "$CLI" doctor --deep >/dev/null 2>&1; echo $?)
rm -rf "$STAGED"

if echo "$OUTPUT" | grep -q "Content (knowledge base):"; then
  pass "clean: --deep emits 'Content (knowledge base):' section"
else
  fail "clean: --deep missing 'Content (knowledge base):' section"
fi

if echo "$OUTPUT" | grep -q "✓ CONTENT_INDEX up to date"; then
  pass "clean: check-index shows ✓"
else
  fail "clean: check-index did not show ✓"
fi

if echo "$OUTPUT" | grep -q "✓ conclusions alignment-verified"; then
  pass "clean: check-conclusions-alignment shows ✓"
else
  fail "clean: check-conclusions-alignment did not show ✓"
fi

if echo "$OUTPUT" | grep -q "✓ addendum model integrity"; then
  pass "clean: check-addendum-integrity shows ✓"
else
  fail "clean: check-addendum-integrity did not show ✓"
fi

if echo "$OUTPUT" | grep -qF "  ✗ " || echo "$OUTPUT" | grep -qF "  ⚠ "; then
  WARN_FAIL=$(echo "$OUTPUT" | grep -F "  ✗ " || echo "$OUTPUT" | grep -F "  ⚠ " || true)
  fail "clean: unexpected ✗/⚠ line(s): $WARN_FAIL"
else
  pass "clean: no ✗ or ⚠ lines in content section"
fi

if [[ "$EXIT_CODE" -eq 0 ]]; then
  pass "clean: exits 0"
else
  fail "clean: unexpected exit $EXIT_CODE"
fi

# ─── Scenario 2: WARN — Complete conclusion missing alignment date ────────────

STAGED2=$(stage_consumer "$CLEAN_FIXTURE")
CONC="$STAGED2/conclusions/phase-01-poc-01-conclusions.md"
# Strip the alignment date from BOTH fields — body and frontmatter — leaving
# them present but empty (WARN, not FAIL; body-only would be an A7 disagreement)
sed -e 's/\*\*Alignment verified:\*\* [0-9-]*/\*\*Alignment verified:\*\*/' \
    -e 's/alignment_verified: "[0-9-]*"/alignment_verified: ""/' "$CONC" > "${CONC}.tmp" \
  && mv "${CONC}.tmp" "$CONC"
WARN_OUTPUT=$(cd "$STAGED2" && node "$CLI" doctor --deep 2>&1) || true
WARN_EXIT=$(cd "$STAGED2" && node "$CLI" doctor --deep >/dev/null 2>&1; echo $?)
rm -rf "$STAGED2"

if echo "$WARN_OUTPUT" | grep -q "⚠ conclusions alignment-verified"; then
  pass "WARN: empty alignment date → ⚠ in output"
else
  fail "WARN: empty alignment date did not produce ⚠ line"
fi

if [[ "$WARN_EXIT" -eq 0 ]]; then
  pass "WARN: exits 0 (advisory, not blocking)"
else
  fail "WARN: unexpected exit $WARN_EXIT (should be 0 — advisory)"
fi

# ─── Scenario 3: FAIL — broken contract (findings file missing header) ────────

STAGED3=$(stage_consumer "$CLEAN_FIXTURE")
printf "# No header here\n\nMissing Author and Date.\n" \
  > "$STAGED3/findings/phase-01-poc-01-results.md"
FAIL_OUTPUT=$(cd "$STAGED3" && node "$CLI" doctor --deep 2>&1) || true
FAIL_EXIT=$(cd "$STAGED3" && node "$CLI" doctor --deep >/dev/null 2>&1; echo $?)
rm -rf "$STAGED3"

if echo "$FAIL_OUTPUT" | grep -q "✗ document format contracts"; then
  pass "FAIL: broken contract → ✗ in output"
else
  fail "FAIL: broken contract did not produce ✗ line"
fi

if [[ "$FAIL_EXIT" -ne 0 ]]; then
  pass "FAIL: exits non-zero"
else
  fail "FAIL: should have exited non-zero but exited 0"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
if [[ "$FAILED" -gt 0 ]]; then
  echo "=== $FAILED doctor --deep CLI test(s) FAILED ==="
  exit 1
fi
echo "=== all doctor --deep CLI tests passed ==="
