#!/usr/bin/env bash
# Swaps the numbers of two active phases.
# Uses a three-step atomic rename (via tmp) to avoid collisions.
#
# Usage:
#   bash scripts/phase-reorder.sh <phase-a> <phase-b>           # execute
#   bash scripts/phase-reorder.sh <phase-a> <phase-b> --dry-run # preview only
#
# Example: bash scripts/phase-reorder.sh 02 04
#
# Scope: plans/ findings/ conclusions/ — NOT plans/_archive/ (read-only)
# Fail-safes (checked before any rename):
#   - Either phase has conclusions/phase-NN-summary.md → abort
#   - Either phase has plans/_archive/phase-NN/ → abort

set -euo pipefail

# Cross-platform in-place sed: macOS BSD sed requires a suffix after -i; GNU sed does not.
# Using -i.bak + cleanup works on both without detecting the platform.
_sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }

A="${1:-}"
B="${2:-}"
DRY_RUN=false
[[ "${3:-}" == "--dry-run" ]] && DRY_RUN=true

if [[ -z "$A" || -z "$B" ]]; then
  echo "Usage: $0 <phase-a> <phase-b> [--dry-run]"
  echo "Example: $0 02 04"
  exit 1
fi

PROJECT_ROOT="$(pwd)"
PLANS="$PROJECT_ROOT/plans"
FINDINGS="$PROJECT_ROOT/findings"
CONCLUSIONS="$PROJECT_ROOT/conclusions"
INDEX="$PROJECT_ROOT/CONTENT_INDEX.md"
CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"
LOG="$PROJECT_ROOT/log.md"
TODAY=$(date +%Y-%m-%d)

say() { echo "$1"; }
run() {
  if $DRY_RUN; then
    echo "  [dry-run] $*"
  else
    eval "$@"
  fi
}

say ""
say "Phase reorder: phase-$A ↔ phase-$B"
$DRY_RUN && say "(dry run — no changes will be made)"
say ""

# Fail-safes
if [[ -f "$CONCLUSIONS/phase-$A-summary.md" ]]; then
  echo "ERROR: Phase $A is concluded (conclusions/phase-$A-summary.md exists). Concluded phases cannot be renumbered."
  exit 2
fi
if [[ -f "$CONCLUSIONS/phase-$B-summary.md" ]]; then
  echo "ERROR: Phase $B is concluded (conclusions/phase-$B-summary.md exists). Concluded phases cannot be renumbered."
  exit 2
fi
if [[ -d "$PLANS/_archive/phase-$A" ]]; then
  echo "ERROR: Phase $A has an archive directory (plans/_archive/phase-$A/). Renaming would break the archive trail."
  exit 2
fi
if [[ -d "$PLANS/_archive/phase-$B" ]]; then
  echo "ERROR: Phase $B has an archive directory (plans/_archive/phase-$B/). Renaming would break the archive trail."
  exit 2
fi

# Collect rename candidates
DIRS=("$PLANS" "$FINDINGS" "$CONCLUSIONS")

say "Rename plan:"
for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' file; do
    basename_file="$(basename "$file")"
    say "  $file → ${file/phase-$A-/phase-TMP-}"
  done < <(find "$dir" -maxdepth 1 -name "phase-$A-*" -print0 2>/dev/null)
  while IFS= read -r -d '' file; do
    say "  $file → ${file/phase-$B-/phase-$A-}"
  done < <(find "$dir" -maxdepth 1 -name "phase-$B-*" -print0 2>/dev/null)
done
say ""

if $DRY_RUN; then
  say "Dry run complete. Re-run without --dry-run to execute."
  exit 0
fi

# Step 1: phase-A → phase-TMP
say "Step 1: Renaming phase-$A → phase-TMP"
for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' file; do
    newfile="${file/phase-$A-/phase-TMP-}"
    mv "$file" "$newfile"
    say "  moved: $(basename "$file") → $(basename "$newfile")"
  done < <(find "$dir" -maxdepth 1 -name "phase-$A-*" -print0 2>/dev/null)
done

# Step 2: phase-B → phase-A
say ""
say "Step 2: Renaming phase-$B → phase-$A"
for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' file; do
    newfile="${file/phase-$B-/phase-$A-}"
    mv "$file" "$newfile"
    say "  moved: $(basename "$file") → $(basename "$newfile")"
  done < <(find "$dir" -maxdepth 1 -name "phase-$B-*" -print0 2>/dev/null)
done

# Step 3: phase-TMP → phase-B
say ""
say "Step 3: Renaming phase-TMP → phase-$B"
for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' file; do
    newfile="${file/phase-TMP-/phase-$B-}"
    mv "$file" "$newfile"
    say "  moved: $(basename "$file") → $(basename "$newfile")"
  done < <(find "$dir" -maxdepth 1 -name "phase-TMP-*" -print0 2>/dev/null)
done

# Step 4: Update internal references inside renamed files (exclude log.md)
say ""
say "Step 4: Updating internal phase references in renamed files"
for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  # Files now have new names — update internal content
  while IFS= read -r -d '' file; do
    if grep -q "phase-$A\b\|phase-$B\b" "$file" 2>/dev/null; then
      # Three-pass sed: A→TMP, B→A, TMP→B
      _sedi "s/phase-$A-/phase-TMP-/g" "$file"
      _sedi "s/phase-$B-/phase-$A-/g" "$file"
      _sedi "s/phase-TMP-/phase-$B-/g" "$file"
      # Also handle bare phase references (e.g. "Phase 02" or "phase: \"02\"")
      _sedi "s/phase-$A\b/phase-TMP/g; s/phase-$B\b/phase-$A/g; s/phase-TMP\b/phase-$B/g" "$file" 2>/dev/null || true
      say "  updated refs: $(basename "$file")"
    fi
  done < <(find "$dir" -maxdepth 1 -name "phase-$A-*" -o -name "phase-$B-*" -print0 2>/dev/null)
done

# Step 5: Update CONTENT_INDEX.md section headers
say ""
say "Step 5: Updating CONTENT_INDEX.md section headers"
if [[ -f "$INDEX" ]]; then
  _sedi "s/Phase $A /Phase TMP /g; s/Phase $B /Phase $A /g; s/Phase TMP /Phase $B /g" "$INDEX"
  _sedi "s/phase-$A-/phase-TMP-/g; s/phase-$B-/phase-$A-/g; s/phase-TMP-/phase-$B-/g" "$INDEX"
  say "  updated CONTENT_INDEX.md"
fi

# Step 6: Update CLAUDE.md if it references either phase
say ""
say "Step 6: Checking CLAUDE.md for phase references"
if [[ -f "$CLAUDE_MD" ]] && grep -q "phase-$A\|Phase $A\|phase-$B\|Phase $B" "$CLAUDE_MD" 2>/dev/null; then
  _sedi "s/Phase $A /Phase TMP /g; s/Phase $B /Phase $A /g; s/Phase TMP /Phase $B /g" "$CLAUDE_MD"
  _sedi "s/phase-$A\b/phase-TMP/g; s/phase-$B\b/phase-$A/g; s/phase-TMP\b/phase-$B/g" "$CLAUDE_MD"
  say "  updated CLAUDE.md"
else
  say "  CLAUDE.md — no phase references found"
fi

# Step 7: Append log entry
say ""
say "Step 7: Appending log.md entry"
printf '\n## [%s] reorder | phase-%s ↔ phase-%s | phases swapped\n' "$TODAY" "$A" "$B" >> "$LOG"
say "  appended to log.md"

say ""
say "Phase reorder complete: phase-$A ↔ phase-$B"
say "Next: run check-index.sh and check-links.sh to verify no broken references remain."
