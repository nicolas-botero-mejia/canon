#!/usr/bin/env bash
# Update-safety contract test (architecture.md §9).
#
# Asserts: after npm update + sync, user files are byte-identical and
# framework dirs are refreshed. This is Phase 2's definition of done.
#
# Run from the package repo root:
#   bash test/update-safety.sh

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

echo "=== update-safety contract test ==="
echo "    pkg root : $PKG_ROOT"
echo "    work dir : $WORK_DIR"
echo ""

# ── Step 1: install the package locally ─────────────────────────────────────
echo "[1] Pack and install package"
cd "$PKG_ROOT"
TARBALL="$(npm pack --silent 2>/dev/null)"
TARBALL_PATH="${PKG_ROOT}/${TARBALL}"

cd "$WORK_DIR"
npm init -y --silent >/dev/null
npm install --silent "${TARBALL_PATH}" >/dev/null
pass "package installed"

# ── Step 2: init a consumer ──────────────────────────────────────────────────
echo "[2] Init consumer"
node "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/bin/cli.mjs" init --yes
pass "init ran"

# Verify doctor passes after init
node "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/bin/cli.mjs" doctor >/dev/null
pass "doctor green after init"

# ── Step 3: write junk into user dirs and CLAUDE.md body ────────────────────
echo "[3] Write user content"
echo "my plans" > "${WORK_DIR}/plans/my-plan.md"
echo "my findings" > "${WORK_DIR}/findings/finding-01.md"
echo "my conclusions" > "${WORK_DIR}/output/conclusions.md"

# Append user content to CLAUDE.md body (the @import line must survive untouched)
echo "" >> "${WORK_DIR}/CLAUDE.md"
echo "## My Project Facts" >> "${WORK_DIR}/CLAUDE.md"
echo "Client: Acme Corp" >> "${WORK_DIR}/CLAUDE.md"

# Snapshot user file checksums
USER_PLAN_SUM="$(md5 -q "${WORK_DIR}/plans/my-plan.md")"
USER_FIND_SUM="$(md5 -q "${WORK_DIR}/findings/finding-01.md")"
USER_OUT_SUM="$(md5 -q "${WORK_DIR}/output/conclusions.md")"
USER_CLAUDE_SUM="$(md5 -q "${WORK_DIR}/CLAUDE.md")"

# Snapshot a framework skill file before the "update"
SKILL_BEFORE="$(md5 -q "${WORK_DIR}/.claude/skills/wiki-manage/SKILL.md")"

pass "user content written and snapshotted"

# ── Step 4: bump payload and re-pack (simulates npm update) ─────────────────
echo "[4] Bump payload version and re-install"

# Inject a marker into a framework file to confirm it gets refreshed
MARKER="# UPDATED-BY-TEST"
echo "$MARKER" >> "${PKG_ROOT}/lib/.claude/skills/wiki-manage/SKILL.md"

# Bump the version
node -e "
const fs = require('fs'), p = '${PKG_ROOT}/package.json';
const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
const [ma,mi,pa] = pkg.version.split('.').map(Number);
pkg.version = \`\${ma}.\${mi}.\${pa+1}\`;
fs.writeFileSync(p, JSON.stringify(pkg,null,2)+'\n');
console.log('version →', pkg.version);
"

cd "$PKG_ROOT"
TARBALL2="$(npm pack --silent 2>/dev/null)"
TARBALL2_PATH="${PKG_ROOT}/${TARBALL2}"

cd "$WORK_DIR"
npm install --silent "${TARBALL2_PATH}" >/dev/null
pass "updated package installed"

# ── Step 5: sync ────────────────────────────────────────────────────────────
echo "[5] sync"
node "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/bin/cli.mjs" sync
pass "sync ran"

# ── Step 6: assert user files untouched ─────────────────────────────────────
echo "[6] Assert user files byte-identical"
[ "$(md5 -q "${WORK_DIR}/plans/my-plan.md")" = "$USER_PLAN_SUM" ] \
  && pass "plans/my-plan.md unchanged" \
  || fail "plans/my-plan.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/findings/finding-01.md")" = "$USER_FIND_SUM" ] \
  && pass "findings/finding-01.md unchanged" \
  || fail "findings/finding-01.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/output/conclusions.md")" = "$USER_OUT_SUM" ] \
  && pass "output/conclusions.md unchanged" \
  || fail "output/conclusions.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/CLAUDE.md")" = "$USER_CLAUDE_SUM" ] \
  && pass "CLAUDE.md body unchanged" \
  || fail "CLAUDE.md was modified by sync"

# ── Step 7: assert framework dirs refreshed ─────────────────────────────────
echo "[7] Assert framework dir refreshed"
grep -q "$MARKER" "${WORK_DIR}/.claude/skills/wiki-manage/SKILL.md" \
  && pass ".claude/skills refreshed (marker present)" \
  || fail ".claude/skills not refreshed after sync"

# ── Step 8: doctor green ────────────────────────────────────────────────────
echo "[8] Doctor"
node "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/bin/cli.mjs" doctor >/dev/null
pass "doctor green after sync"

# ── Cleanup: revert payload marker and version bump ─────────────────────────
cd "$PKG_ROOT"
# Remove the injected marker line
node -e "
const fs = require('fs'), p = 'lib/.claude/skills/wiki-manage/SKILL.md';
const lines = fs.readFileSync(p,'utf8').split('\n').filter(l => l !== '# UPDATED-BY-TEST');
fs.writeFileSync(p, lines.join('\n'));
"
# Revert version bump
node -e "
const fs = require('fs'), p = 'package.json';
const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
const [ma,mi,pa] = pkg.version.split('.').map(Number);
pkg.version = \`\${ma}.\${mi}.\${pa-1}\`;
fs.writeFileSync(p, JSON.stringify(pkg,null,2)+'\n');
"
# Remove tarballs
rm -f "${TARBALL_PATH}" "${TARBALL2_PATH}"

echo ""
echo "=== ALL ASSERTIONS PASSED — §9 update-safety contract holds ==="
