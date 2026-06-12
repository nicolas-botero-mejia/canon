#!/usr/bin/env bash
# Checks that all relative markdown links in project files resolve to existing paths.
# Exits 2 if broken links are found. (Advisory from the Stop hook — see bin/hook.sh.)

PROJECT_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIRS=("wiki" "findings" "plans" "conclusions" "CONTENT_INDEX.md" "CLAUDE.md" ".claude")

# Dependency check — node required for link extraction (ADR-019 stage 3; node is
# present by construction in consumers — the package arrived via npm)
if ! command -v node &>/dev/null; then
  echo "⚠  check-links.sh requires node."
  exit 1
fi
BROKEN=()

check_file() {
  local file="$1"
  local file_dir
  file_dir="$(dirname "$file")"

  # Link extraction runs on the Node core (ADR-019 stage 3): micromark tokens,
  # so fenced/inline code yields no links and titled links yield the bare path
  # (the old python regex grabbed the title into the target).
  while IFS= read -r target; do
    # Strip any fragment (#section)
    target="${target%%#*}"
    [[ -z "$target" ]] && continue

    # Only check relative paths
    [[ "$target" != ./* && "$target" != ../* ]] && continue

    resolved="$file_dir/$target"
    # -e, not -f: directory targets like [x](./deliverables/) are valid links
    if [[ ! -e "$resolved" ]]; then
      BROKEN+=("${file#$PROJECT_ROOT/} → $target")
    fi
  done < <(node "${SCRIPT_DIR}/../../bin/validate-md.mjs" link-targets "$file" 2>/dev/null)
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
