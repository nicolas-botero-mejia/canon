#!/usr/bin/env bash
# Integration test orchestrator. Run from package repo root.
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

run_test "update-safety" "${DIR}/update-safety.sh"

if [ "$FAILED" -gt 0 ]; then
  echo "=== $FAILED integration test(s) FAILED ==="
  exit 1
fi
echo "=== all integration tests passed ==="
