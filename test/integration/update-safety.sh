#!/usr/bin/env bash
# Update-safety contract test (architecture.md §9).
#
# Asserts: after npm update + sync, user files are byte-identical and
# framework dirs are refreshed. This is Phase 2's definition of done.
#
# Run from the package repo root:
#   bash test/integration/update-safety.sh

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
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

# ── Step 2b: verify v0.1.4 dirs exist after init ────────────────────────────
echo "[2b] Verify init created all expected directories"
[ -d "${WORK_DIR}/wiki/client" ] && pass "wiki/client/ created on init" || fail "wiki/client/ missing after init"
[ -d "${WORK_DIR}/wiki/user" ]   && pass "wiki/user/ created on init"   || fail "wiki/user/ missing after init"
[ -d "${WORK_DIR}/deliverables" ] && pass "deliverables/ created on init" || fail "deliverables/ missing after init"

# Verify /signal skill is vendored
[ -f "${WORK_DIR}/.claude/skills/signal/SKILL.md" ] \
  && pass "/signal skill vendored to .claude/skills/signal/SKILL.md" \
  || fail "/signal skill not found at .claude/skills/signal/SKILL.md"

# Verify new lifecycle skills are vendored
[ -f "${WORK_DIR}/.claude/skills/activity-deprecate/SKILL.md" ] \
  && pass "/activity-deprecate skill vendored" \
  || fail "/activity-deprecate skill not found at .claude/skills/activity-deprecate/SKILL.md"

[ -f "${WORK_DIR}/.claude/skills/activity-update/SKILL.md" ] \
  && pass "/activity-update skill vendored" \
  || fail "/activity-update skill not found at .claude/skills/activity-update/SKILL.md"

[ -f "${WORK_DIR}/.claude/skills/activity-migrate/SKILL.md" ] \
  && pass "/activity-migrate skill vendored" \
  || fail "/activity-migrate skill not found at .claude/skills/activity-migrate/SKILL.md"

[ -f "${WORK_DIR}/.claude/skills/phase-deprecate/SKILL.md" ] \
  && pass "/phase-deprecate skill vendored" \
  || fail "/phase-deprecate skill not found at .claude/skills/phase-deprecate/SKILL.md"

[ -f "${WORK_DIR}/.claude/skills/phase-reorder/SKILL.md" ] \
  && pass "/phase-reorder skill vendored" \
  || fail "/phase-reorder skill not found at .claude/skills/phase-reorder/SKILL.md"

[ -f "${WORK_DIR}/.claude/skills/phase-update/SKILL.md" ] \
  && pass "/phase-update skill vendored" \
  || fail "/phase-update skill not found at .claude/skills/phase-update/SKILL.md"

# Verify templates are accessible in node_modules
[ -f "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/lib/templates/session.plan-template.md" ] \
  && pass "session.plan-template.md accessible in node_modules" \
  || fail "session.plan-template.md missing from node_modules"

[ -f "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/lib/wiki/system-tool-integration.md" ] \
  && pass "system-tool-integration.md accessible in node_modules" \
  || fail "system-tool-integration.md missing from node_modules"

# ── Step 3: write junk into user dirs and CLAUDE.md body ────────────────────
echo "[3] Write user content"
echo "my plans" > "${WORK_DIR}/plans/my-plan.md"
echo "my findings" > "${WORK_DIR}/findings/finding-01.md"
echo "my conclusions" > "${WORK_DIR}/conclusions/conclusions.md"

# Write content into wiki/client and wiki/user (user-owned dirs)
echo "client info" > "${WORK_DIR}/wiki/client/client-profile.md"
echo "user info" > "${WORK_DIR}/wiki/user/user-research.md"

# Write content into deliverables (user-owned dir)
echo "deliverable" > "${WORK_DIR}/deliverables/report-v1.md"

# Append user content to CLAUDE.md body (the @import line must survive untouched)
echo "" >> "${WORK_DIR}/CLAUDE.md"
echo "## My Project Facts" >> "${WORK_DIR}/CLAUDE.md"
echo "Client: Acme Corp" >> "${WORK_DIR}/CLAUDE.md"

# Snapshot user file checksums
USER_PLAN_SUM="$(md5 -q "${WORK_DIR}/plans/my-plan.md")"
USER_FIND_SUM="$(md5 -q "${WORK_DIR}/findings/finding-01.md")"
USER_OUT_SUM="$(md5 -q "${WORK_DIR}/conclusions/conclusions.md")"
USER_CLAUDE_SUM="$(md5 -q "${WORK_DIR}/CLAUDE.md")"
USER_CLIENT_SUM="$(md5 -q "${WORK_DIR}/wiki/client/client-profile.md")"
USER_USER_SUM="$(md5 -q "${WORK_DIR}/wiki/user/user-research.md")"
USER_DELIV_SUM="$(md5 -q "${WORK_DIR}/deliverables/report-v1.md")"

# Snapshot a framework skill file before the "update"
SKILL_BEFORE="$(md5 -q "${WORK_DIR}/.claude/skills/wiki-manage/SKILL.md")"

pass "user content written and snapshotted"

# ── Step 4: bump package version and re-pack (simulates npm update) ──────────
echo "[4] Bump package version and re-install"

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

[ "$(md5 -q "${WORK_DIR}/conclusions/conclusions.md")" = "$USER_OUT_SUM" ] \
  && pass "conclusions/conclusions.md unchanged" \
  || fail "conclusions/conclusions.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/CLAUDE.md")" = "$USER_CLAUDE_SUM" ] \
  && pass "CLAUDE.md body unchanged" \
  || fail "CLAUDE.md was modified by sync"

# Assert wiki/client and wiki/user are NOT overwritten by sync (user-owned)
[ "$(md5 -q "${WORK_DIR}/wiki/client/client-profile.md")" = "$USER_CLIENT_SUM" ] \
  && pass "wiki/client/ NOT overwritten by sync" \
  || fail "wiki/client/client-profile.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/wiki/user/user-research.md")" = "$USER_USER_SUM" ] \
  && pass "wiki/user/ NOT overwritten by sync" \
  || fail "wiki/user/user-research.md was modified by sync"

[ "$(md5 -q "${WORK_DIR}/deliverables/report-v1.md")" = "$USER_DELIV_SUM" ] \
  && pass "deliverables/ NOT overwritten by sync" \
  || fail "deliverables/report-v1.md was modified by sync"

# ── Step 7: assert framework dirs refreshed ─────────────────────────────────
echo "[7] Assert framework dir refreshed"
grep -q "$MARKER" "${WORK_DIR}/.claude/skills/wiki-manage/SKILL.md" \
  && pass ".claude/skills refreshed (marker present)" \
  || fail ".claude/skills not refreshed after sync"

# ── Step 8: doctor green ────────────────────────────────────────────────────
echo "[8] Doctor"
node "${WORK_DIR}/node_modules/@nicolas-botero-mejia/canon/bin/cli.mjs" doctor >/dev/null
pass "doctor green after sync"

# ── Cleanup: revert marker and version bump ──────────────────────────────────
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
