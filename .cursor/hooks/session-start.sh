#!/usr/bin/env bash
# Cursor sessionStart hook.
# Injects current date + project state as additional_context.
# Reuses lib/scripts/session-start-report.sh for the project state logic.
# Informational only — never exits non-zero.

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

date_str=$(date "+%A, %B %d, %Y %H:%M %Z")

# Run the shared report script (outputs Claude-format JSON) and extract the text
report_json=$(bash "$PROJECT_ROOT/node_modules/@nicolas-botero-mejia/canon/lib/scripts/session-start-report.sh" 2>/dev/null)
project_state=$(echo "$report_json" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d['hookSpecificOutput']['additionalContext'])
except Exception:
    print('(project state unavailable)')
" 2>/dev/null)

context="Current date and time: $date_str\n\n$project_state"

python3 -c "
import json, sys
context = sys.argv[1]
print(json.dumps({'additional_context': context}))
" "$context"

exit 0
