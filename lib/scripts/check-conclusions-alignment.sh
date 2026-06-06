#!/usr/bin/env bash
# check-conclusions-alignment.sh — warns if Complete conclusions are missing alignment dates.
#
# Finds all conclusions/*.md files with "**Status:** Complete" and checks that each one
# has a non-empty "**Alignment verified:** YYYY-MM-DD" date.
#
# Exits 0 always — this is a warning, not a hard block.
# Rationale: some conclusions predate Rule 12 and would false-positive on a hard block.
# The warning is designed to be impossible to miss at session close.

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/output"

UNVERIFIED=()

if [[ ! -d "$OUTPUT_DIR" ]]; then
    exit 0
fi

while IFS= read -r -d '' file; do
    # Only check files with Status: Complete
    if ! grep -q '\*\*Status:\*\*[[:space:]]*Complete' "$file"; then
        continue
    fi

    # Check for a non-empty Alignment verified date (YYYY-MM-DD format)
    if ! grep -qE '\*\*Alignment verified:\*\*[[:space:]]+[0-9]{4}-[0-9]{2}-[0-9]{2}' "$file"; then
        UNVERIFIED+=("${file#$PROJECT_ROOT/}")
    fi
done < <(find "$OUTPUT_DIR" -name "*.md" -print0)

if [[ ${#UNVERIFIED[@]} -gt 0 ]]; then
    echo "⚠  Complete conclusions without Alignment verified date:"
    for f in "${UNVERIFIED[@]}"; do
        echo "   - $f"
    done
    echo ""
    echo "Run /conclusions-review on these files, or set the field manually:"
    echo "  **Alignment verified:** $(date +%Y-%m-%d)"
fi

exit 0
