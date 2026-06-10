#!/usr/bin/env bash
# Checks that every .md file in monitored project dirs is listed in CONTENT_INDEX.md.
# Exits 2 if any files are missing. (Advisory from the Stop hook — see bin/hook.sh.)

PROJECT_ROOT="$(pwd)"
INDEX="$PROJECT_ROOT/CONTENT_INDEX.md"
DIRS=("wiki" "findings" "plans" "conclusions" "deliverables")
MISSING=()

if [[ ! -f "$INDEX" ]]; then
  echo "⚠  CONTENT_INDEX.md not found at project root."
  exit 2
fi

for dir in "${DIRS[@]}"; do
  dir_path="$PROJECT_ROOT/$dir"
  [[ ! -d "$dir_path" ]] && continue

  while IFS= read -r -d '' file; do
    filename=$(basename "$file")

    # Skip README.md files and anything in _archive/
    [[ "$filename" == "README.md" ]] && continue
    [[ "$file" == *"/_archive/"* ]] && continue

    RELPATH="${file#$PROJECT_ROOT/}"
    # Only count a path as registered if it appears in a markdown link — not merely
    # mentioned in prose — prevents substring false-positives (G3).
    if ! grep -F "$RELPATH" "$INDEX" | grep -qE '\]\(\.?/?' ; then
      MISSING+=("$RELPATH")
    fi
  done < <(find "$dir_path" -name "*.md" -print0)
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "⚠  CONTENT_INDEX.md is stale. These files are not listed:"
  for f in "${MISSING[@]}"; do
    echo "   - $f"
  done
  echo ""
  echo "Update CONTENT_INDEX.md before finishing this session."
  exit 2
fi

# --- Mtime check: files newer than CONTENT_INDEX.md may have stale index entries ---
# GNU first, BSD fallback — never the reverse: GNU `stat -f %m` "succeeds" printing
# the mount point, which poisons the chain (mtime branch was dead on Linux until the
# unit test caught it in CI).
INDEX_MTIME=$(stat -c %Y "$INDEX" 2>/dev/null || stat -f %m "$INDEX" 2>/dev/null)
POSSIBLY_STALE=()

if [[ -n "$INDEX_MTIME" ]]; then
  for dir in "${DIRS[@]}"; do
    dir_path="$PROJECT_ROOT/$dir"
    [[ ! -d "$dir_path" ]] && continue

    while IFS= read -r -d '' file; do
      filename=$(basename "$file")
      [[ "$filename" == "README.md" ]] && continue
      [[ "$file" == *"/_archive/"* ]] && continue

      FILE_MTIME=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
      if [[ -n "$FILE_MTIME" && "$FILE_MTIME" -gt "$INDEX_MTIME" ]]; then
        POSSIBLY_STALE+=("${file#$PROJECT_ROOT/}")
      fi
    done < <(find "$dir_path" -name "*.md" -print0)
  done
fi

if [[ ${#POSSIBLY_STALE[@]} -gt 0 ]]; then
  echo "⚠  Files modified after CONTENT_INDEX.md — entries may need updating:"
  for f in "${POSSIBLY_STALE[@]}"; do
    echo "   - $f"
  done
  echo ""
  echo "Review these entries in CONTENT_INDEX.md and update if status or key facts changed."
fi

exit 0
