#!/usr/bin/env bash
# check-addendum-integrity.sh — validates the in-file addendum model (ADR-010, Dim 10–11).
#
# Addenda are appended as "## Addendum NN" sections inside the parent POC conclusions
# file — never as standalone files — and each section carries its own alignment date.
#
#   FAIL (exit 1): a standalone *addendum*-conclusions.md file in conclusions/ (old model).
#   WARN (exit 0, ⚠): a "## Addendum NN" section missing a non-empty
#                     **Addendum alignment verified:** YYYY-MM-DD date.
#   PASS (exit 0): clean (or no conclusions/ yet).
#
# Scope is intentionally LOCAL/mechanical. The cross-file check — a roadmap addendum
# marked ✅ Complete with no section in the parent — is left to /knowledge-audit (Dim 10),
# which can reason across files. Run from the consumer project root.

PROJECT_ROOT="$(pwd)"
CONCLUSIONS="$PROJECT_ROOT/conclusions"
ERRORS=0

[ -d "$CONCLUSIONS" ] || exit 0

# ── FAIL: standalone addendum conclusions files (retired model) ───────────────
STANDALONE=()
while IFS= read -r -d '' f; do
  STANDALONE+=("${f#$PROJECT_ROOT/}")
done < <(find "$CONCLUSIONS" -name '*addendum*conclusions*.md' ! -path '*/_archive/*' -print0 2>/dev/null)

if [ ${#STANDALONE[@]} -gt 0 ]; then
  echo "✗ Standalone addendum conclusions file(s) — addenda must be appended as '## Addendum NN'"
  echo "  sections in the parent POC conclusions file, not standalone files (ADR-010):"
  for f in "${STANDALONE[@]}"; do echo "   - $f"; done
  ERRORS=$((ERRORS + 1))
fi

# ── WARN: "## Addendum NN" sections missing an alignment date ──────────────────
# The date lives in the section header block, before the first sub-heading (## H8…),
# so "next ## heading" reliably bounds the search.
UNVERIFIED=()
while IFS= read -r -d '' f; do
  while IFS= read -r section; do
    UNVERIFIED+=("$section")
  done < <(awk -v file="${f#$PROJECT_ROOT/}" '
    /^## Addendum [0-9]/ {
      if (in_sec && !found) print file " §" secname
      in_sec = 1; found = 0; secname = $0; sub(/^## /, "", secname); next
    }
    /^## / && in_sec {
      if (!found) print file " §" secname
      in_sec = 0; found = 0; next
    }
    in_sec && /^\*\*Addendum alignment verified:\*\*[[:space:]]+[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/ { found = 1 }
    END { if (in_sec && !found) print file " §" secname }
  ' "$f")
done < <(find "$CONCLUSIONS" -name '*-conclusions.md' ! -path '*/_archive/*' -print0 2>/dev/null)

if [ ${#UNVERIFIED[@]} -gt 0 ]; then
  echo "⚠  Addendum sections without an Addendum alignment verified date:"
  for s in "${UNVERIFIED[@]}"; do echo "   - $s"; done
  echo ""
  echo "Run /conclusions-review on the parent file, or set the field manually:"
  echo "  **Addendum alignment verified:** $(date +%Y-%m-%d)"
fi

[ "$ERRORS" -gt 0 ] && exit 1
exit 0
