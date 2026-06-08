#!/usr/bin/env bash
# Cursor postToolUse hook — fires after Write and StrReplace tool calls.
# Checks the written file for stale references using lib/scripts/check-stale-refs.sh.
# Returns additional_context with warnings when stale refs are detected.
#
# Note: Cursor's postToolUse cannot hard-block (unlike Claude's PostToolUse).
# The agent receives the warning as context and must address it before continuing.
#
# Cursor tool_input field is "path" (not "file_path" as in Claude Code).
# Both are tried for forward compatibility.

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHECK_SCRIPT="$PROJECT_ROOT/node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-stale-refs.sh"

INPUT=$(cat 2>/dev/null)
if [[ -z "$INPUT" ]]; then
    exit 0
fi

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    ti = data.get('tool_input', {})
    # Cursor uses 'path'; Claude Code uses 'file_path'
    print(ti.get('path', '') or ti.get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Only check files in wiki/ or plans/
if [[ "$FILE_PATH" != *"/wiki/"* && "$FILE_PATH" != *"/plans/"* ]]; then
    exit 0
fi

RESULT=$(bash "$CHECK_SCRIPT" --file "$FILE_PATH" 2>/dev/null)
CHECK_EXIT=$?

if [[ $CHECK_EXIT -eq 2 && -n "$RESULT" ]]; then
    python3 -c "
import json, sys
result = sys.argv[1]
file_path = sys.argv[2]
msg = ('⚠ Stale reference detected in ' + file_path +
       ' — fix before continuing.\n\n' + result)
print(json.dumps({'additional_context': msg}))
" "$RESULT" "$FILE_PATH"
fi

exit 0
