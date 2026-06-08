#!/usr/bin/env bash
# Background file watcher — detects .md files added/modified outside Claude sessions.
# Writes to .claude/pending-updates.log (read by session-start-report.sh).
#
# Anti-bubble: CONTENT_INDEX.md and the sentinel itself are excluded from the watch.
# Multiple sessions are safe — the sentinel is append-only; whoever indexes a file
# first makes subsequent reads a no-op.
#
# Usage:
#   bash scripts/watch-project.sh          # foreground (Ctrl-C to stop)
#   bash scripts/watch-project.sh &        # background
#
# Requires: fswatch (brew install fswatch)

PROJECT_ROOT="$(pwd)"
SENTINEL="$PROJECT_ROOT/.claude/pending-updates.log"

if ! command -v fswatch &>/dev/null; then
  echo "fswatch not found. Install with: brew install fswatch"
  exit 1
fi

echo "Watching $PROJECT_ROOT for changes. Logging to .claude/pending-updates.log"
echo "Press Ctrl-C to stop."

fswatch -r \
  --exclude "CONTENT_INDEX\\.md$" \
  --exclude "pending-updates\\.log$" \
  --exclude "/_archive/" \
  --exclude "/\\.obsidian/" \
  --exclude "/\\.DS_Store" \
  --include "\\.md$" \
  "$PROJECT_ROOT/wiki" \
  "$PROJECT_ROOT/findings" \
  "$PROJECT_ROOT/plans" \
  "$PROJECT_ROOT/conclusions" \
  "$PROJECT_ROOT/raw" \
| while IFS= read -r changed_file; do
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "$timestamp $changed_file" >> "$SENTINEL"
  done
