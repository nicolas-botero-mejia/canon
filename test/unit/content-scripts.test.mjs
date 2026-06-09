/**
 * content-scripts.test.mjs — Behavioral tests for the five knowledge-base content
 * scripts that `canon doctor --deep` and the Stop hook run.
 *
 * Unlike invariants.test.mjs (which only asserts the scripts *contain* certain
 * strings), these EXECUTE each script against fixtures under test/fixtures/ and
 * assert real detection behavior: a compliant tree passes, and each known
 * violation class trips exactly the right script with the right exit code.
 *
 * Each case replays a failure class from the CRC→Canon migration. See
 * test/fixtures/README.md for the fixture model and the PASS/WARN/FAIL tiers.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, execSync } from 'node:child_process'
import { join } from 'node:path'

const PKG = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const SCRIPTS = join(PKG, 'lib', 'scripts')
const FIXTURES = join(PKG, 'test', 'fixtures')

// python3 is a hard dependency of check-links.sh (and post-write-check.sh). Skip
// those cases rather than fail when it's absent, so the suite is environment-robust.
let HAS_PYTHON3 = false
try { execSync('command -v python3', { stdio: 'ignore' }); HAS_PYTHON3 = true } catch { /* no python3 */ }
const needsPython = HAS_PYTHON3 ? false : 'python3 not available'

function runScript(scriptName, fixtureRel) {
  const res = spawnSync('bash', [join(SCRIPTS, `${scriptName}.sh`)], {
    cwd: join(FIXTURES, fixtureRel),
    encoding: 'utf8',
  })
  return { status: res.status, out: `${res.stdout || ''}${res.stderr || ''}` }
}

// ─── Happy path: a compliant tree passes every script (no false positives) ────

for (const s of ['check-index', 'check-stale-refs', 'check-conclusions-alignment', 'check-contracts', 'check-addendum-integrity']) {
  test(`clean-populated: ${s} passes (exit 0)`, () => {
    const { status, out } = runScript(s, 'clean-populated')
    assert.equal(status, 0, `${s} should pass on a compliant tree:\n${out}`)
  })
}

test('clean-populated: check-links passes (exit 0)', { skip: needsPython }, () => {
  const { status, out } = runScript('check-links', 'clean-populated')
  assert.equal(status, 0, `check-links should pass on a compliant tree:\n${out}`)
})

// ─── FAIL tier: each violation class trips exactly one script ──────────────────

test('bad/content-index-missing-parts → check-contracts FAILs (exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/content-index-missing-parts')
  assert.equal(status, 1, out)
  assert.match(out, /missing required parts/)
})

test('bad/roadmap-bad-status → check-contracts FAILs (exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/roadmap-bad-status')
  assert.equal(status, 1, out)
  assert.match(out, /unknown status values/)
})

test('bad/findings-missing-header → check-contracts FAILs (exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/findings-missing-header')
  assert.equal(status, 1, out)
  assert.match(out, /findings header missing/)
})

test('bad/conclusions-missing-alignment → check-contracts FAILs (missing field, exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/conclusions-missing-alignment')
  assert.equal(status, 1, out)
  assert.match(out, /conclusions header missing/)
})

test('bad/unregistered-file → check-index FAILs (exit 2)', () => {
  const { status, out } = runScript('check-index', 'bad/unregistered-file')
  assert.equal(status, 2, out)
  assert.match(out, /not listed/)
})

test('bad/broken-link → check-links FAILs (exit 2)', { skip: needsPython }, () => {
  const { status, out } = runScript('check-links', 'bad/broken-link')
  assert.equal(status, 2, out)
  assert.match(out, /Broken markdown links/)
})

// ─── G3 gap: check-index uses substring matching (grep -qF), so a path merely
// MENTIONED in prose counts as "registered" — it never binds a file to a real
// four-part entry. This fixture passes when arguably it should not. ─────────────
test('bad/index-substring-false-positive → check-index PASSES on a prose-only mention (G3 gap)', () => {
  const { status, out } = runScript('check-index', 'bad/index-substring-false-positive')
  assert.equal(status, 0, 'substring match treats a bare prose mention as registration')
  assert.doesNotMatch(out, /not listed/)
})

// ─── WARN tier (G2): present-but-empty alignment passes contracts yet warns ────
// This pair documents the gap that lets unverified stubs through doctor --deep,
// which judges on exit code only and so reports a green check here.

test('bad/conclusions-empty-alignment → check-contracts PASSES (field present, exit 0)', () => {
  const { status, out } = runScript('check-contracts', 'bad/conclusions-empty-alignment')
  assert.equal(status, 0, out)
})

test('bad/conclusions-empty-alignment → check-conclusions-alignment WARNs but exits 0 (G2)', () => {
  const { status, out } = runScript('check-conclusions-alignment', 'bad/conclusions-empty-alignment')
  assert.equal(status, 0, 'advisory by design — exits 0 even when it warns')
  assert.match(out, /Alignment verified/)
})

// ─── FAIL tier: more correct detections from the migration's violation set ─────

test('bad/decisions-tracker-missing-columns → check-contracts FAILs (exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/decisions-tracker-missing-columns')
  assert.equal(status, 1, out)
  assert.match(out, /Decisions Tracker missing required columns/)
})

test('bad/roadmap-malformed-row → check-contracts FAILs on the "|| **01-Add02**" row (exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/roadmap-malformed-row')
  assert.equal(status, 1, out)
  assert.match(out, /unknown status values/)
})

// A lone wrong label IS caught — but only because it drops the global count, not
// because the entry is validated. Pairs with the demoted-heading gap below.
test('bad/content-index-variant-label → check-contracts FAILs (wrong label drops count, exit 1)', () => {
  const { status, out } = runScript('check-contracts', 'bad/content-index-variant-label')
  assert.equal(status, 1, out)
  assert.match(out, /missing required parts/)
})

// ─── Known FALSE POSITIVE (G14): the roadmap status check excludes "| POC …" rows
// (so real POC statuses are never validated) and mis-reads the 2nd column of any
// OTHER table as a status. A legitimate "Decisions this roadmap closes" table trips
// it — which is exactly why the migration had to convert that table to bullets.
// Flip to expect exit 0 once the roadmap check is scoped to the POC table only.
test('bad/roadmap-secondary-table → check-contracts FALSE-POSITIVEs on a valid secondary table (G14)', () => {
  const { status, out } = runScript('check-contracts', 'bad/roadmap-secondary-table')
  assert.equal(status, 1, out)
  assert.match(out, /unknown status values/)
})

// ─── Known GAPS: these PASS today though the content is malformed/unwatched. They
// pin the blind spots so that when a check is tightened, the test flips and is
// updated (the same RED-first convention invariants.test.mjs uses). ─────────────

// Count-balancing: a heading demoted to #### is not counted as an entry, so the
// four-part check skips it entirely even though it carries no blocks.
test('bad/content-index-demoted-heading → check-contracts PASSES (#### heading evades the count)', () => {
  const { status, out } = runScript('check-contracts', 'bad/content-index-demoted-heading')
  assert.equal(status, 0, out)
})

// G7: check-links scans wiki/findings/plans/CONTENT_INDEX/.claude — NOT conclusions/
// or CLAUDE.md. The identical broken link fails in bad/broken-link (wiki/).
test('bad/links-unscanned-paths → check-links PASSES despite broken links in conclusions/ + CLAUDE.md (G7)', { skip: needsPython }, () => {
  const { status, out } = runScript('check-links', 'bad/links-unscanned-paths')
  assert.equal(status, 0, out)
  assert.doesNotMatch(out, /Broken markdown links/)
})

// G9: check-index watches wiki/findings/plans/conclusions — NOT deliverables/. An
// unregistered .md under deliverables/ is never flagged, even though the index is
// otherwise enforced (the findings file here IS registered).
test('bad/deliverables-unindexed → check-index PASSES despite an unregistered deliverables/*.md (G9)', () => {
  const { status, out } = runScript('check-index', 'bad/deliverables-unindexed')
  assert.equal(status, 0, out)
  assert.doesNotMatch(out, /not listed/)
})

// ─── Addendum integrity (check-addendum-integrity) ─────────────────────────────
// FAIL: a standalone *addendum*-conclusions.md file (retired model, ADR-010).
// WARN: a "## Addendum NN" section missing its alignment date.
// (clean-populated's conclusion carries a valid ## Addendum 01 section — covered by
// the happy-path loop above.)

test('bad/addendum-standalone-file → check-addendum-integrity FAILs (exit 1)', () => {
  const { status, out } = runScript('check-addendum-integrity', 'bad/addendum-standalone-file')
  assert.equal(status, 1, out)
  assert.match(out, /Standalone addendum/)
})

test('bad/addendum-section-unverified → check-addendum-integrity WARNs but exits 0', () => {
  const { status, out } = runScript('check-addendum-integrity', 'bad/addendum-section-unverified')
  assert.equal(status, 0, out)
  assert.match(out, /Addendum alignment verified/)
})
