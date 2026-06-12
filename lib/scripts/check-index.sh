#!/usr/bin/env bash
# Checks that every .md file in monitored project dirs is listed in CONTENT_INDEX.md.
# Exits 2 if any files are missing. (Advisory from the Stop hook — see bin/hook.sh.)

PROJECT_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX="$PROJECT_ROOT/CONTENT_INDEX.md"
DIRS=("wiki" "findings" "plans" "conclusions" "deliverables")
MISSING=()

if [[ ! -f "$INDEX" ]]; then
  echo "⚠  CONTENT_INDEX.md not found at project root."
  exit 2
fi

# Gather candidate files (filesystem dispatch stays in bash — ADR-019)
CANDIDATES=()
for dir in "${DIRS[@]}"; do
  dir_path="$PROJECT_ROOT/$dir"
  [[ ! -d "$dir_path" ]] && continue

  while IFS= read -r -d '' file; do
    filename=$(basename "$file")

    # Skip README.md files and anything in _archive/
    [[ "$filename" == "README.md" ]] && continue
    [[ "$file" == *"/_archive/"* ]] && continue

    CANDIDATES+=("${file#$PROJECT_ROOT/}")
  done < <(find "$dir_path" -name "*.md" -print0)
done

# Registered = the full relative path is a markdown link *target* in the index,
# answered by the Node core (ADR-019 stage 2): fence-aware and target-exact.
# This keeps G3's guarantee (a prose mention is not registration) and kills the
# line-grep false negative (prose mention + unrelated link on one line passed).
if [[ ${#CANDIDATES[@]} -gt 0 ]]; then
  if command -v node >/dev/null 2>&1; then
    REG_OUT=$(node "${SCRIPT_DIR}/../../bin/validate-md.mjs" index-registration "$INDEX" "${CANDIDATES[@]}" 2>&1) \
      && REG_STATUS=0 || REG_STATUS=$?
    if [[ "$REG_STATUS" -eq 1 ]]; then
      while IFS= read -r line; do
        [[ -n "$line" ]] && MISSING+=("$line")
      done <<< "$REG_OUT"
    elif [[ "$REG_STATUS" -ne 0 ]]; then
      echo "⚠  check-index: validate-md.mjs failed (exit ${REG_STATUS}) — skipping registration check."
    fi
  else
    echo "⚠  check-index: node not found — skipping registration check."
  fi
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "⚠  CONTENT_INDEX.md is stale. These files are not listed:"
  for f in "${MISSING[@]}"; do
    echo "   - $f"
  done
  echo ""
  echo "Update CONTENT_INDEX.md before finishing this session."
  exit 2
fi

# Mtime-staleness warning retired with ADR-021: the project layer is generated
# from file frontmatter (`canon index`) — regenerate beats warn.
exit 0
