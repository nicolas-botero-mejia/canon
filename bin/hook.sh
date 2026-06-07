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
    # Redirect stdout → stderr so pass/warn messages reach the terminal but are NOT
    # fed back to the model as a new prompt (Claude Code feeds Stop hook stdout to the
    # model, which would re-trigger the hook on every response — infinite loop).
    # Failures use exit 2, which Claude Code surfaces regardless of this redirect.
    { bash "${META}/check-index.sh" \
    && bash "${META}/check-links.sh" \
    && bash "${META}/check-stale-refs.sh" \
    && bash "${META}/check-conclusions-alignment.sh" \
    && bash "${META}/check-contracts.sh"; } >&2
    ;;
  *)
    echo "hook.sh: unknown event '${EVENT}'" >&2
    exit 1
    ;;
esac
