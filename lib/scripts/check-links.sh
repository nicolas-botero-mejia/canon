#!/usr/bin/env bash
# Checks that all relative markdown links in project files resolve to existing files.
# Exits 2 if broken links are found. (Advisory from the Stop hook — see bin/hook.sh.)

PROJECT_ROOT="$(pwd)"
DIRS=("wiki" "findings" "plans" "CONTENT_INDEX.md" ".claude")

# Dependency check — python3 required for link extraction
if ! command -v python3 &>/dev/null; then
  echo "⚠  check-links.sh requires python3."
  echo "   Install: brew install python3"
  exit 1
fi
BROKEN=()

check_file() {
  local file="$1"
  local file_dir
  file_dir="$(dirname "$file")"

  # Extract relative link targets — lines like [text](./path) or [text](../path)
  while IFS= read -r target; do
    # Strip any fragment (#section)
    target="${target%%#*}"
    [[ -z "$target" ]] && continue

    # Only check relative paths
    [[ "$target" != ./* && "$target" != ../* ]] && continue

    resolved="$file_dir/$target"
    if [[ ! -f "$resolved" ]]; then
      BROKEN+=("${file#$PROJECT_ROOT/} → $target")
    fi
  done < <(python3 -c "
import re, sys
content = open(sys.argv[1]).read()
# Remove fenced code blocks before extracting links
content = re.sub(r'\`\`\`.*?\`\`\`', '', content, flags=re.DOTALL)
# Remove inline code spans
content = re.sub(r'\`[^\`]+\`', '', content)
for m in re.findall(r'\]\(([^)]+)\)', content):
    print(m)
" "$file" 2>/dev/null)
}

for entry in "${DIRS[@]}"; do
  path="$PROJECT_ROOT/$entry"
  if [[ -f "$path" ]]; then
    check_file "$path"
  elif [[ -d "$path" ]]; then
    while IFS= read -r -d '' file; do
      [[ "$file" == *"/_archive/"* ]] && continue
      check_file "$file"
    done < <(find "$path" -name "*.md" -print0)
  fi
done

if [[ ${#BROKEN[@]} -gt 0 ]]; then
  echo "⚠  Broken markdown links found:"
  for b in "${BROKEN[@]}"; do
    echo "   - $b"
  done
  echo ""
  echo "Fix broken links before finishing this session."
  exit 2
fi

exit 0
