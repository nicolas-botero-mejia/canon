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

# First 10 lines of the document BODY — leading YAML frontmatter (--- … ---) is
# metadata, not the header block. Templates carry frontmatter (ADR-021), so a
# raw `head -10` would never reach the **Author:**/**Date:** lines.
header_window() {
  awk 'NR==1 && /^---$/ { infm=1; next }
       infm && /^---$/  { infm=0; next }
       infm { next }
       { print; n++; if (n==10) exit }' "$1"
}

# ── CONTENT_INDEX.md: per-entry validation (path-tiered two-form model) ──────
# Validation lives in the Node core (ADR-019): a fence-aware markdownlint rule —
# headings and markers inside code blocks are not entries (the awk predecessor
# could not see fences). This block is dispatch + ✓/✗ formatting only; the CLI
# protocol is `OK <count>` on exit 0, issue lines on exit 1.
if [ -f "${CONSUMER_ROOT}/CONTENT_INDEX.md" ]; then
  if ! grep -q "^### " "${CONSUMER_ROOT}/CONTENT_INDEX.md"; then
    pass "CONTENT_INDEX.md: no entries yet (empty index)"
  elif ! command -v node >/dev/null 2>&1; then
    warn "CONTENT_INDEX.md entry check skipped — node not on PATH (required since ADR-019)"
  else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ENTRY_OUT=$(node "${SCRIPT_DIR}/../../bin/validate-md.mjs" content-index "${CONSUMER_ROOT}/CONTENT_INDEX.md" 2>&1) \
      && ENTRY_STATUS=0 || ENTRY_STATUS=$?

    if [ "$ENTRY_STATUS" -eq 0 ]; then
      ENTRY_COUNT="${ENTRY_OUT#OK }"
      if [ "$ENTRY_COUNT" -eq 0 ] 2>/dev/null; then
        pass "CONTENT_INDEX.md: no entries yet (empty index)"
      else
        pass "CONTENT_INDEX.md: ${ENTRY_COUNT} entr$([ "$ENTRY_COUNT" -eq 1 ] && echo y || echo ies) — all valid (per-entry structure check)"
      fi
    else
      while IFS= read -r issue; do
        [ -n "$issue" ] && fail "$issue"
      done <<< "$ENTRY_OUT"
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
  # Check the first 10 body lines (frontmatter-aware) for **Author:** and **Date:**
  HEADER="$(header_window "$f")"
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
  HEADER="$(header_window "$f")"
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

# ── wiki/client + wiki/user: no YAML frontmatter (ADR-012) ───────────────────
# MCP serves these layers as whole documents; frontmatter breaks the read model.
FM_COUNT=0
FM_FAIL=0
for dir in "wiki/client" "wiki/user"; do
  for f in "${CONSUMER_ROOT}/${dir}/"*.md; do
    [ -f "$f" ] || continue
    case "$(basename "$f")" in README.md) continue ;; esac
    FM_COUNT=$((FM_COUNT + 1))
    if head -1 "$f" | grep -q "^---$"; then
      fail "${dir}/$(basename "$f"): YAML frontmatter not allowed (ADR-012 — client/user wiki files are read whole)"
      FM_FAIL=$((FM_FAIL + 1))
    fi
  done
done
if [ "$FM_COUNT" -eq 0 ]; then
  pass "wiki client/user frontmatter: no files to check (ok for new projects)"
elif [ "$FM_FAIL" -eq 0 ]; then
  pass "wiki client/user frontmatter: ${FM_COUNT} file(s) — none carry frontmatter (ADR-012)"
fi

# ── Result ───────────────────────────────────────────────────────────────────
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "check-contracts: ${ERRORS} violation(s) found"
  exit 1
fi
echo "check-contracts: all structural contracts satisfied"
