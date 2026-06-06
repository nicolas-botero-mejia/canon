#!/usr/bin/env bash
# Runs at session start. Reports project state as hookSpecificOutput.
# Informational only — never exits 2.

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INDEX="$PROJECT_ROOT/CONTENT_INDEX.md"
SENTINEL="$PROJECT_ROOT/.claude/pending-updates.log"
CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"
TODAY=$(date -u +%Y-%m-%d)

# --- File counts ---
count_md() {
  local dir="$PROJECT_ROOT/$1"
  [[ ! -d "$dir" ]] && echo 0 && return
  find "$dir" -name "*.md" ! -path "*/_archive/*" ! -name "README.md" | wc -l | tr -d ' '
}

wiki_count=$(count_md "wiki")
findings_count=$(count_md "findings")
plans_count=$(count_md "plans")
output_count=$(count_md "output")

# --- Pending external updates ---
pending_lines=""
if [[ -f "$SENTINEL" && -s "$SENTINEL" ]]; then
  # Find files in sentinel not yet listed in the index
  while IFS= read -r line; do
    filepath=$(echo "$line" | awk '{print $2}')
    filename=$(basename "$filepath")
    if [[ -f "$filepath" ]] && ! grep -qF "$filename" "$INDEX" 2>/dev/null; then
      pending_lines="$pending_lines\n      $filepath"
    fi
  done < "$SENTINEL"
fi

# --- CLAUDE.md age ---
claude_age_warning=""
if [[ -f "$CLAUDE_MD" ]]; then
  mod_epoch=$(stat -f %m "$CLAUDE_MD" 2>/dev/null || stat -c %Y "$CLAUDE_MD" 2>/dev/null)
  now_epoch=$(date +%s)
  age_days=$(( (now_epoch - mod_epoch) / 86400 ))
  if [[ $age_days -gt 14 ]]; then
    claude_age_warning="  ⚠  CLAUDE.md last updated ${age_days} days ago — review if confirmed facts have changed"
  fi
fi

# --- Build report ---
report="Project state — $TODAY:"
report="$report\n  wiki/: $wiki_count files | findings/: $findings_count files | plans/: $plans_count files | conclusions/: $output_count files"

if [[ -n "$pending_lines" ]]; then
  count=$(echo -e "$pending_lines" | grep -c '\S')
  report="$report\n  ⚠  $count file(s) added outside session — not yet indexed:$pending_lines"
else
  report="$report\n  ✓ No pending external updates"
fi

if [[ -n "$claude_age_warning" ]]; then
  report="$report\n$claude_age_warning"
fi

# Output in hookSpecificOutput format so it appears in session context
printf '{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "%s"}}' \
  "$(echo -e "$report" | sed 's/"/\\"/g')"
