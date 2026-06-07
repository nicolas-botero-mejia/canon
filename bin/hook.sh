#!/usr/bin/env bash
# Dispatcher called by consumer settings.json / hooks.json.
# Routes hook events to the framework scripts in lib/scripts/.
# Usage: bash node_modules/@nicolas-botero-mejia/canon/bin/hook.sh <EventName>

set -euo pipefail

EVENT="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
META="${SCRIPT_DIR}/../lib/scripts"

case "$EVENT" in
  SessionStart)
    bash "${META}/session-start-report.sh"
    ;;
  PostToolUse)
    bash "${META}/post-write-check.sh"
    ;;
  Stop)
    # Capture all output (stdout + stderr). Only emit on failure.
    # Claude Code feeds Stop hook stdout back to the model as a new prompt — any output
    # on a clean pass triggers another turn → re-fires Stop → infinite loop.
    # On failure (exit 2): emit captured output so Claude sees what to fix.
    # On clean pass: total silence — session closes without prompting the model.
    STOP_OUT=$(
      bash "${META}/check-index.sh" \
      && bash "${META}/check-links.sh" \
      && bash "${META}/check-stale-refs.sh" \
      && bash "${META}/check-conclusions-alignment.sh" \
      && bash "${META}/check-contracts.sh" 2>&1
    )
    STOP_EXIT=$?
    if [[ $STOP_EXIT -ne 0 ]]; then
      echo "$STOP_OUT"
      exit $STOP_EXIT
    fi
    ;;
  *)
    echo "hook.sh: unknown event '${EVENT}'" >&2
    exit 1
    ;;
esac
