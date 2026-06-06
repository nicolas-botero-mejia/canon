#!/usr/bin/env bash
# Hook test orchestrator. Run from package repo root.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED=0

run_test() {
  local name="$1" script="$2"
  echo ">>> $name"
  if bash "$script"; then
    echo "    PASSED: $name"
  else
    echo "    FAILED: $name"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

run_test "hook-dispatcher" "${DIR}/hook-dispatcher.test.sh"

if [ "$FAILED" -gt 0 ]; then
  echo "=== $FAILED hook test(s) FAILED ==="
  exit 1
fi
echo "=== all hook tests passed ==="
