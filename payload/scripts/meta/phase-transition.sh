#!/usr/bin/env bash
# Transitions the project from one phase to the next.
# Archives current phase plans, scaffolds the next phase index, updates pointers.
#
# Usage:
#   bash scripts/phase-transition.sh <from> <to>           # execute
#   bash scripts/phase-transition.sh <from> <to> --dry-run # preview only
#
# Example: bash scripts/phase-transition.sh 01 02

set -euo pipefail

FROM="${1:-}"
TO="${2:-}"
DRY_RUN=false
[[ "${3:-}" == "--dry-run" ]] && DRY_RUN=true

if [[ -z "$FROM" || -z "$TO" ]]; then
  echo "Usage: $0 <from-phase> <to-phase> [--dry-run]"
  echo "Example: $0 01 02"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLANS="$PROJECT_ROOT/plans"
ARCHIVE="$PLANS/_archive/phase-$FROM"
TEMPLATE="$PROJECT_ROOT/scripts/templates/phase-index-template.md"  # internal script asset — exempt from [process-type].[file-type]-template.md convention
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
say "Phase transition: phase-$FROM → phase-$TO"
$DRY_RUN && say "(dry run — no changes will be made)"
say ""

# 1. Create archive directory
say "1. Archiving phase-$FROM plans → plans/_archive/phase-$FROM/"
run "mkdir -p \"$ARCHIVE\""
while IFS= read -r -d '' file; do
  run "mv \"$file\" \"$ARCHIVE/\""
  say "   moved: $(basename "$file")"
done < <(find "$PLANS" -maxdepth 1 -name "phase-$FROM-*.md" -print0)

# 2. Scaffold new phase index
say ""
say "2. Creating plans/phase-$TO-index.md from template"
NEW_INDEX="$PLANS/phase-$TO-index.md"
if [[ ! -f "$TEMPLATE" ]]; then
  say "   ⚠  Template not found at scripts/templates/phase-index-template.md — skipping"
else
  if $DRY_RUN; then
    say "  [dry-run] create $NEW_INDEX"
  else
    sed \
      -e "s/{{PHASE_NUMBER}}/$TO/g" \
      -e "s/{{PHASE_FROM}}/$FROM/g" \
      -e "s/{{DATE}}/$TODAY/g" \
      "$TEMPLATE" > "$NEW_INDEX"
    say "   created: plans/phase-$TO-index.md"
  fi
fi

# 3. Update CONTENT_INDEX.md — archive old plans section, add new phase entry
say ""
say "3. Updating CONTENT_INDEX.md plans section"
if $DRY_RUN; then
  say "  [dry-run] update plans section in CONTENT_INDEX.md"
else
  # Add archive note before the old phase entry (simple append to plans section)
  # The actual editing is done surgically — we add a note that phase-FROM is archived
  if grep -q "phase-$FROM-index.md" "$INDEX"; then
    sed -i '' "s|phase-$FROM-index.md|phase-$FROM-index.md _(archived)_|g" "$INDEX"
    say "   marked phase-$FROM entries as archived"
  fi
  # Append new phase placeholder to plans table
  sed -i '' "s|plans/_archive/.*do not edit.*|plans/_archive/         → Superseded plans (do not edit)\n| \`plans/phase-$TO-index.md\` | **Active.** Phase $TO overview: decisions tracker, session mapping, risk register |" "$INDEX"
  say "   added phase-$TO-index.md entry"
fi

# 4. Append log entry
say ""
say "4. Appending log.md entry"
LOG_ENTRY="\n## [$TODAY] restructure | plans/ | Phase $FROM→$TO transition\nPhase $FROM plans archived to plans/_archive/phase-$FROM/. Phase $TO index scaffolded."
if $DRY_RUN; then
  say "  [dry-run] append to log.md: $LOG_ENTRY"
else
  echo -e "$LOG_ENTRY" >> "$LOG"
  say "   appended to log.md"
fi

say ""
say "Phase transition complete."
say "Next: fill in plans/phase-$TO-index.md — decisions tracker, session list, facts."
say "Create individual session files on demand as each session approaches."
