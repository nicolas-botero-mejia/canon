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
    # Advisory consistency gate — surfaces knowledge-base issues at session end but
    # NEVER blocks the stop (never exit 2). Rationale:
    #   * A blocking Stop hook on global repo state loops forever on inherited / un-fixable
    #     debt: Claude Code feeds exit-2 output back to the model, which re-fires Stop.
    #     (The old `set -e` also made it silent — a failing check aborted the script before
    #     it could report, so the loop ran with empty "No stderr output".)
    #   * Enforcement of NEW issues already happens inline at write time via PostToolUse.
    #     This is a human-facing reminder that ROUTES to the right remedy.
    # An exit-0 Stop hook cannot loop by construction; no stop_hook_active guard is needed.
    set +e
    names=""
    failed=0
    # Run every check independently (no && short-circuit) so the human sees ALL failing
    # dimensions at once. Keep the banner a concise SUMMARY — the full per-file detail
    # lives in `canon doctor --deep`, which this routes to.
    for chk in check-index check-links check-stale-refs check-conclusions-alignment check-contracts; do
      bash "${META}/${chk}.sh" >/dev/null 2>&1
      if [[ $? -ne 0 ]]; then
        failed=$(( failed + 1 ))
        case "$chk" in
          check-index)                 label="CONTENT_INDEX.md out of date (unregistered files)" ;;
          check-links)                 label="broken markdown links" ;;
          check-stale-refs)            label="stale references to renamed/removed files" ;;
          check-conclusions-alignment) label="conclusions missing alignment verification" ;;
          check-contracts)             label="document format / contract violations" ;;
          *)                           label="$chk" ;;
        esac
        names+="  • ${label}"$'\n'
      fi
    done
    set -e
    if [[ $failed -gt 0 ]]; then
      msg="⚠ ${failed} knowledge-base issue(s) flagged at session end"$'\n'
      msg+="(advisory — the session still ends; a half-migrated repo shows inherited debt here):"$'\n\n'
      msg+="${names}"$'\n'
      msg+="See the full per-file report with fixes:"$'\n'
      msg+="  ->  canon doctor --deep    (full diagnostics)"$'\n'
      msg+="  ->  /knowledge-audit       (guided triage & proposed fixes)"$'\n'
      msg+="  ->  canon sync             (only if framework/install drift)"
      # JSON-escape for the systemMessage field (portable — no jq/python dependency).
      esc=$( printf '%s' "$msg" | awk 'BEGIN{ ORS="" }
        { gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); gsub(/\r/, "\\r");
          if (NR > 1) printf "\\n"; printf "%s", $0 }' )
      printf '{"suppressOutput": true, "systemMessage": "%s"}\n' "$esc"
    fi
    exit 0
    ;;
  *)
    echo "hook.sh: unknown event '${EVENT}'" >&2
    exit 1
    ;;
esac