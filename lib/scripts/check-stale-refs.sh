#!/usr/bin/env bash
# check-stale-refs.sh — detects deprecated tool/pattern references in wiki/ files.
#
# Supports two modes:
#   Full mode (no args)   — scan all .md files in wiki/
#   File mode (--file F)  — scan a single file (used by PostToolUse hook)
#
# Exits 2 (blocking) if stale references found; exits 0 if clean.
#
# Code blocks (``` ... ```) are skipped — examples and historical configs inside
# code blocks are expected to reference deprecated tools.
#
# plans/ is intentionally excluded: plan files are execution-time artifacts and
# completed POC plans legitimately document the tools they used. Modifying them
# would destroy historical accuracy. wiki/ files are living reference docs and
# must stay current.
#
# Maintain PATTERN when new tools/approaches are retired.

PROJECT_ROOT="$(pwd)"

# --- Deprecated patterns (extend when tools/approaches are retired) ---
# Pipe-separated regex of retired tool/approach names that must not appear in live
# wiki/ or plans/ references. Add the exact string a stale reference would use, e.g.
# 'old-cli-name|legacy_config|SomeLib v1'. The placeholder below matches nothing, so a
# fresh project starts clean — replace it as tools are retired.
PATTERN='__RETIRED_PATTERN_PLACEHOLDER__'

# --- Context words that mark an intentional reference ---
# Covers: deprecation markers, comparison/replacement prose, URL lines
EXCLUSION='deprecated|removed|superseded|deferred|struck through|no longer|⚠|was retired|legacy|formerly|replaced by|old approach|replaces|replace |was:|neither|identical|vs |known issue|bug|superior|prefer|http|github'

# --- Parse args ---
SINGLE_FILE=""
if [[ "$1" == "--file" && -n "$2" ]]; then
    SINGLE_FILE="$2"
fi

# strip_code_blocks: reads a file, outputs non-code-block lines as "LINENUM:CONTENT"
strip_code_blocks() {
    awk '
        /^[[:space:]]*(```|~~~)/ { in_block = !in_block; next }
        !in_block                { print NR ":" $0 }
    ' "$1"
}

# --- Run the search ---
VIOLATIONS=()

if [[ -n "$SINGLE_FILE" ]]; then
    # File mode — check one file
    [[ -f "$SINGLE_FILE" ]] || exit 0
    REL="${SINGLE_FILE#$PROJECT_ROOT/}"
    while IFS= read -r match; do
        VIOLATIONS+=("$REL:$match")
    done < <(
        strip_code_blocks "$SINGLE_FILE" \
        | grep -iE "$PATTERN" \
        | grep -viE "$EXCLUSION"
    )
else
    # Full mode — scan wiki/ only
    while IFS= read -r -d '' file; do
        rel="${file#$PROJECT_ROOT/}"
        while IFS= read -r match; do
            VIOLATIONS+=("$rel:$match")
        done < <(
            strip_code_blocks "$file" \
            | grep -iE "$PATTERN" \
            | grep -viE "$EXCLUSION"
        )
    done < <(
        find "$PROJECT_ROOT/wiki" -name "*.md" \
            ! -path "*/_archive/*" \
            -print0 2>/dev/null
    )
fi

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
    echo "⚠  Stale references detected in wiki:"
    for v in "${VIOLATIONS[@]}"; do
        echo "   - $v"
    done
    echo ""
    echo "Update or remove these references before finishing this session."
    echo "If intentional (documenting removal), add a context word to the line:"
    echo "  deprecated / removed / superseded / deferred / replaced by / ⚠"
    exit 2
fi

exit 0
