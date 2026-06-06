#!/usr/bin/env bash
# post-write-check.sh — PostToolUse hook for Write and Edit tool calls.
#
# Claude Code pipes the tool-use JSON to this script's stdin.
# We extract tool_input.file_path and run check-stale-refs.sh --file on it
# for any file in wiki/ or plans/.
#
# If stale references are found, we return JSON with decision: "block" (exit 0).
# This prevents Claude from proceeding until the violation is fixed.
# The Write already happened — Claude is told to correct the file before continuing.
#
# Note: exit 2 is NON-BLOCKING for PostToolUse (unlike PreToolUse). Decision
# control requires JSON output with {"decision": "block"} and exit 0.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(pwd)"  # cwd = consumer project root when invoked via hook dispatcher
CHECK_SCRIPT="${SCRIPT_DIR}/check-stale-refs.sh"
INDEX="$PROJECT_ROOT/CONTENT_INDEX.md"

# Read JSON payload from stdin (Claude Code closes the pipe after sending)
INPUT=$(cat 2>/dev/null)
if [[ -z "$INPUT" ]]; then
    exit 0
fi

# Extract file_path via stdin pipe to python3 (avoids arg-length limits on large writes)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# For findings/ and output/ files: warn if not yet in CONTENT_INDEX (advisory, non-blocking)
if [[ "$FILE_PATH" == *"/findings/"* || "$FILE_PATH" == *"/output/"* ]]; then
    FILENAME=$(basename "$FILE_PATH")
    if [[ -f "$INDEX" ]] && ! grep -qF "$FILENAME" "$INDEX"; then
        python3 -c "
import json, sys
filename = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'PostToolUse',
        'additionalContext': '⚠ ' + filename + ' not yet in CONTENT_INDEX.md — register it before session close.'
    }
}))
" "$FILENAME"
    fi
    exit 0
fi

# Only run stale-ref check for wiki/ and plans/ files
if [[ "$FILE_PATH" != *"/wiki/"* && "$FILE_PATH" != *"/plans/"* ]]; then
    exit 0
fi

# Run stale-ref check on this specific file
RESULT=$(bash "$CHECK_SCRIPT" --file "$FILE_PATH" 2>/dev/null)
CHECK_EXIT=$?

if [[ $CHECK_EXIT -eq 2 && -n "$RESULT" ]]; then
    # Return JSON block decision — the Write happened, but Claude must fix before continuing
    python3 -c "
import json, sys
result = sys.argv[1]
file_path = sys.argv[2]
print(json.dumps({
    'decision': 'block',
    'reason': 'Stale reference introduced in ' + file_path + ' — fix before continuing.',
    'hookSpecificOutput': {
        'hookEventName': 'PostToolUse',
        'additionalContext': result
    }
}))
" "$RESULT" "$FILE_PATH"
    exit 0
fi

exit 0
