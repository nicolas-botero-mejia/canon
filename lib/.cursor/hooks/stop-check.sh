#!/usr/bin/env bash
# Cursor stop hook — runs consistency checks before the agent session ends.
# Mirrors the Claude "Stop" hook in .claude/settings.json.
#
# Runs four checks in sequence:
#   1. check-index.sh      — all .md files listed in CONTENT_INDEX.md (blocking in Claude, warning here)
#   2. check-links.sh      — no broken relative markdown links (blocking in Claude, warning here)
#   3. check-stale-refs.sh — no deprecated tool/pattern references in wiki/ (blocking in Claude, warning here)
#   4. check-conclusions-alignment.sh — Complete conclusions have Alignment verified dates (always advisory)
#
# Returns a followup_message if any warnings or errors are found, so the agent
# sees them and can address them before the user closes the session.
# Exits 0 always (Cursor stop hooks do not support hard blocking via exit 2).

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPTS="$PROJECT_ROOT/node_modules/@nicolas-botero-mejia/canon/lib/scripts"

WARNINGS=""

run_check() {
    local label="$1"
    local script="$2"
    local output exit_code

    output=$(bash "$script" 2>/dev/null)
    exit_code=$?

    # Only surface a pre-close warning when the check actually FAILED (exit != 0).
    # The check scripts exit non-zero on real problems (missing index entries,
    # broken links, stale refs) and exit 0 for advisory-only output — e.g.
    # check-index.sh prints an mtime-drift ⚠ but still exits 0, and
    # check-conclusions-alignment.sh is advisory by design. The old `-n "$output"`
    # test fired on ANY stdout, turning those advisories into empty-looking
    # pre-close blocks, so we gate on the exit code instead.
    if [[ $exit_code -ne 0 ]]; then
        WARNINGS="$WARNINGS\n--- $label ---\n$output\n"
    fi
}

run_check "Index check"               "$SCRIPTS/check-index.sh"
run_check "Link check"                "$SCRIPTS/check-links.sh"
run_check "Stale reference check"     "$SCRIPTS/check-stale-refs.sh"
run_check "Conclusions alignment"     "$SCRIPTS/check-conclusions-alignment.sh"

if [[ -n "$WARNINGS" ]]; then
    python3 -c "
import json, sys
warnings = sys.argv[1]
msg = ('⚠ Pre-close checks found issues — address before finishing the session:\n\n'
       + warnings)
print(json.dumps({'followup_message': msg}))
" "$(echo -e "$WARNINGS")"
fi

exit 0
