#!/usr/bin/env bash
# Runner for the canon skill evals (ADR-020). Stages a real consumer via
# `canon init` in a scratch dir (outside the repo — ADR-023 forbids init
# inside it), then points promptfoo's working_dir at it so the evals exercise
# the actual vendored skills a consumer would have.
#
# Billed: invokes Claude via the Agent SDK. Never wired into push-CI.
# Usage: npm run test:evals   (requires ANTHROPIC_API_KEY)

set -euo pipefail

PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "✗ ANTHROPIC_API_KEY is not set — these evals invoke Claude and bill the key."
  echo "  Free mechanics check instead: npm run test:evals:selftest"
  exit 1
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
echo "Staging eval consumer in $WORK ..."
( cd "$WORK" && node "$PKG/bin/cli.mjs" init --yes >/dev/null )

mkdir -p "$PKG/test/evals/results"
export CANON_EVAL_WORKDIR="$WORK"
npx --yes promptfoo@latest eval \
  -c "$PKG/test/evals/promptfooconfig.yaml" \
  --output "$PKG/test/evals/results/latest.json" \
  --no-cache

echo ""
echo "Results: test/evals/results/latest.json (gitignored)."
echo "Convention (ADR-020): every eval failure becomes a pinned regression scenario in promptfooconfig.yaml."
