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
    bash "${META}/check-index.sh" \
    && bash "${META}/check-links.sh" \
    && bash "${META}/check-stale-refs.sh" \
    && bash "${META}/check-conclusions-alignment.sh"
    ;;
  *)
    echo "hook.sh: unknown event '${EVENT}'" >&2
    exit 1
    ;;
esac
