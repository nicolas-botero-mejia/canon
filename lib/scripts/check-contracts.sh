#!/usr/bin/env bash
# Validates structural contracts for key file types at session close.
# Run from the consumer project root.
# Exit 0 = all checks passed (or no files to check).
# Exit 1 = one or more violations found.

set -euo pipefail

CONSUMER_ROOT="$(pwd)"
ERRORS=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  ⚠  $1"; }

# ── CONTENT_INDEX.md: per-entry validation (path-tiered two-form model) ──────
# Valid entry forms: full four-part (all three markers present) OR lightweight
# (zero markers — acceptable for mechanism files like agents, skills, templates).
# Invalid: partial block (1–2 of 3 markers) or an entry heading below ### level.
if [ -f "${CONSUMER_ROOT}/CONTENT_INDEX.md" ]; then
  if ! grep -q "^### " "${CONSUMER_ROOT}/CONTENT_INDEX.md"; then
    pass "CONTENT_INDEX.md: no entries yet (empty index)"
  else
    ENTRY_ISSUES=$(awk '
    BEGIN { heading=""; level=0; wii=0; kf=0; qia=0; in_block=0 }
    function check_block(    total) {
      if (!in_block) return
      if (level >= 4 && index(heading, ".md") > 0) {
        print "CONTENT_INDEX.md: entry demoted below ### level (all file entries must use ###): " heading
        return
      }
      total = wii + kf + qia
      if (total >= 1 && total <= 2) {
        print "CONTENT_INDEX.md: entry is missing required parts (" total "/3 found — need all of What it is, Key facts, Questions it answers): " heading
      }
    }
    /^#+/ {
      check_block()
      heading = substr($0, 1, 80)
      match($0, /^#+/)
      level = RLENGTH
      wii = 0; kf = 0; qia = 0
      in_block = 1
    }
    /^\*\*What it is:\*\*/      { wii = 1 }
    /^\*\*Key facts:\*\*/       { kf  = 1 }
    /^\*\*Questions it answers:\*\*/ { qia = 1 }
    END { check_block() }
    ' "${CONSUMER_ROOT}/CONTENT_INDEX.md")

    if [ -n "$ENTRY_ISSUES" ]; then
      while IFS= read -r issue; do
        fail "$issue"
      done <<< "$ENTRY_ISSUES"
    else
      ENTRY_COUNT=$(grep -c "^### " "${CONSUMER_ROOT}/CONTENT_INDEX.md" || true)
      pass "CONTENT_INDEX.md: ${ENTRY_COUNT} entr$([ "$ENTRY_COUNT" -eq 1 ] && echo y || echo ies) — all valid (per-entry structure check)"
    fi
  fi
else
  warn "CONTENT_INDEX.md not found — skipping entry format check"
fi

# ── Phase index §Decisions Tracker columns ───────────────────────────────────
PHASE_INDEX_COUNT=0
PHASE_INDEX_FAIL=0
for f in "${CONSUMER_ROOT}/plans/phase-"*"-index.md"; do
  [ -f "$f" ] || continue
  PHASE_INDEX_COUNT=$((PHASE_INDEX_COUNT + 1))
  # Check for required Decisions Tracker header row
  if grep -q "| ID " "$f" && grep -q "| Description " "$f" && grep -q "| Status " "$f" && grep -q "Closed" "$f"; then
    :
  else
    fail "$(basename "$f"): §Decisions Tracker missing required columns (ID | Description | Status | Closed / Deferred)"
    PHASE_INDEX_FAIL=$((PHASE_INDEX_FAIL + 1))
  fi
done
if [ "$PHASE_INDEX_COUNT" -eq 0 ]; then
  pass "phase index: no phase index files found (ok for new projects)"
elif [ "$PHASE_INDEX_FAIL" -eq 0 ]; then
  pass "phase index: ${PHASE_INDEX_COUNT} file(s) — all have required Decisions Tracker columns"
fi

# ── POC roadmap status emoji set ─────────────────────────────────────────────
ROADMAP_COUNT=0
ROADMAP_FAIL=0
for f in "${CONSUMER_ROOT}/plans/phase-"*"-poc-roadmap.md"; do
  [ -f "$f" ] || continue
  ROADMAP_COUNT=$((ROADMAP_COUNT + 1))
  # Allowed status values: core emojis + terminal text statuses
  # Core: 🔜 Planned | ⏳ In Progress | 🔄 | ✅ Complete | ⏭️
  # Terminal: Deprecated | ~~In Progress~~ Deprecated | Migrated → Phase NN
  # Extract only rows from the POC table (between the "| POC #" header and the next ## heading)
  # to avoid false-positives from secondary tables in the same file (G14).
  POC_TABLE=$(awk '/^\| POC #/{found=1} found && /^##/{exit} found{print}' "$f")
  BAD=$(echo "$POC_TABLE" | grep "^|" | grep -v "^| POC\|^| Addendum\|^|---\|^| #" | awk -F'|' '{print $3}' | grep -v "^[[:space:]]*$" | grep -v "Status" | \
    grep -v "🔜\|⏳\|🔄\|✅\|⏭️\|^[[:space:]]*$\|Deprecated\|Migrated\|~~In Progress~~" || true)
  if [ -n "$BAD" ]; then
    fail "$(basename "$f"): unknown status values found: $BAD"
    ROADMAP_FAIL=$((ROADMAP_FAIL + 1))
  fi
done
if [ "$ROADMAP_COUNT" -eq 0 ]; then
  pass "poc roadmap: no roadmap files found (ok for new projects)"
elif [ "$ROADMAP_FAIL" -eq 0 ]; then
  pass "poc roadmap: ${ROADMAP_COUNT} file(s) — all use allowed status values"
fi

# ── findings/*.md: Author and Date in header ─────────────────────────────────
FINDINGS_COUNT=0
FINDINGS_FAIL=0
for f in "${CONSUMER_ROOT}/findings/"*.md; do
  [ -f "$f" ] || continue
  FINDINGS_COUNT=$((FINDINGS_COUNT + 1))
  # Check first 10 lines for **Author:** and **Date:**
  HEADER="$(head -10 "$f")"
  HAS_AUTHOR=$(echo "$HEADER" | grep -c "^\*\*Author:\*\*" || true)
  HAS_DATE=$(echo "$HEADER" | grep -c "^\*\*Date:\*\*\|^\*\*Synthesis date:\*\*" || true)
  if [ "$HAS_AUTHOR" -eq 0 ] || [ "$HAS_DATE" -eq 0 ]; then
    fail "$(basename "$f"): findings header missing required fields (Author: ${HAS_AUTHOR}, Date: ${HAS_DATE})"
    FINDINGS_FAIL=$((FINDINGS_FAIL + 1))
  fi
done
if [ "$FINDINGS_COUNT" -eq 0 ]; then
  pass "findings: no findings files found (ok for new projects)"
elif [ "$FINDINGS_FAIL" -eq 0 ]; then
  pass "findings: ${FINDINGS_COUNT} file(s) — all have **Author:** and **Date:** in header"
fi

# ── conclusions/*.conclusions.md: Author, Date, Alignment verified ───────────
CONCLUSIONS_COUNT=0
CONCLUSIONS_FAIL=0
for f in "${CONSUMER_ROOT}/conclusions/"*.md; do
  [ -f "$f" ] || continue
  CONCLUSIONS_COUNT=$((CONCLUSIONS_COUNT + 1))
  HEADER="$(head -10 "$f")"
  HAS_AUTHOR=$(echo "$HEADER" | grep -c "^\*\*Author:\*\*" || true)
  HAS_DATE=$(echo "$HEADER" | grep -c "^\*\*Date:\*\*\|^\*\*Synthesis date:\*\*" || true)
  HAS_ALIGN=$(grep -c "^\*\*Alignment verified:\*\*" "$f" || true)
  if [ "$HAS_AUTHOR" -eq 0 ] || [ "$HAS_DATE" -eq 0 ] || [ "$HAS_ALIGN" -eq 0 ]; then
    fail "$(basename "$f"): conclusions header missing fields (Author: ${HAS_AUTHOR}, Date: ${HAS_DATE}, Alignment verified: ${HAS_ALIGN})"
    CONCLUSIONS_FAIL=$((CONCLUSIONS_FAIL + 1))
  fi
done
if [ "$CONCLUSIONS_COUNT" -eq 0 ]; then
  pass "conclusions: no conclusions files found (ok for new projects)"
elif [ "$CONCLUSIONS_FAIL" -eq 0 ]; then
  pass "conclusions: ${CONCLUSIONS_COUNT} file(s) — all have required header fields"
fi

# ── Result ───────────────────────────────────────────────────────────────────
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "check-contracts: ${ERRORS} violation(s) found"
  exit 1
fi
echo "check-contracts: all structural contracts satisfied"
