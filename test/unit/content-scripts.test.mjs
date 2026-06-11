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
import { mkdtempSync, cpSync, utimesSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'

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

// ─── G3 fixed: check-index now requires the path to appear in a markdown link,
// not just anywhere in prose. A path only mentioned in plain text is flagged. ────
test('bad/index-substring-false-positive → check-index FAILs on a prose-only mention (G3 fixed)', () => {
  const { status, out } = runScript('check-index', 'bad/index-substring-false-positive')
  assert.equal(status, 2, 'prose-only path mention is not a registration')
  assert.match(out, /not listed/)
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

// ─── ADR-012: wiki/client + wiki/user files must not carry YAML frontmatter ───
// One bad file (frontmatter) + one good file (none) in the same fixture: the
// check must name only the violating file.
test('bad/wiki-client-frontmatter → check-contracts FAILs (ADR-012)', () => {
  const { status, out } = runScript('check-contracts', 'bad/wiki-client-frontmatter')
  assert.equal(status, 1, out)
  assert.match(out, /frontmatter not allowed/)
  assert.match(out, /profile-bad\.md/)
  assert.doesNotMatch(out, /profile-good\.md: YAML/)
})

// ─── G14 fixed: roadmap status check is now scoped to the POC table only.
// A secondary table in the same file no longer triggers false positives. ──────────
test('bad/roadmap-secondary-table → check-contracts PASSes (secondary table no longer trips status check, G14 fixed)', () => {
  const { status, out } = runScript('check-contracts', 'bad/roadmap-secondary-table')
  assert.equal(status, 0, out)
  assert.doesNotMatch(out, /unknown status values/)
})

// ─── Known GAPS: these PASS today though the content is malformed/unwatched. They
// pin the blind spots so that when a check is tightened, the test flips and is
// updated (the same RED-first convention invariants.test.mjs uses). ─────────────

// Demoted heading: per-entry check catches #### .md headings regardless of markers.
test('bad/content-index-demoted-heading → check-contracts FAILs (#### heading caught by per-entry check)', () => {
  const { status, out } = runScript('check-contracts', 'bad/content-index-demoted-heading')
  assert.equal(status, 1, out)
  assert.match(out, /demoted/)
})

// ADR-019 stage 1: validation moved to the Node core (fence-aware). A documentation
// example inside a code block is not an entry — the awk predecessor false-positived here.
test('bad/content-index-fenced-example → check-contracts PASSes (fenced ### is not an entry)', () => {
  const { status, out } = runScript('check-contracts', 'bad/content-index-fenced-example')
  assert.equal(status, 0, out)
  assert.match(out, /1 entry — all valid/)
})

// G7 fixed: check-links now scans conclusions/ and CLAUDE.md too.
test('bad/links-unscanned-paths → check-links FAILs on broken links in conclusions/ + CLAUDE.md (G7 fixed)', { skip: needsPython }, () => {
  const { status, out } = runScript('check-links', 'bad/links-unscanned-paths')
  assert.equal(status, 2, out)
  assert.match(out, /Broken markdown links/)
})

// G9 fixed: check-index now watches deliverables/ too.
test('bad/deliverables-unindexed → check-index FAILs on an unregistered deliverables/*.md (G9 fixed)', () => {
  const { status, out } = runScript('check-index', 'bad/deliverables-unindexed')
  assert.equal(status, 2, out)
  assert.match(out, /not listed/)
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

// ─── check-stale-refs: PATTERN injection (CANON_STALE_PATTERN env var) ────────
// The shipped PATTERN is a placeholder that matches nothing. Consumers populate it
// when they retire tools. Tests inject a real pattern via env to exercise the
// detection, exclusion, and code-block-skip logic without modifying the script.

function runStaleRefs(fixtureRel, env = {}) {
  const res = spawnSync('bash', [join(SCRIPTS, 'check-stale-refs.sh')], {
    cwd: join(FIXTURES, fixtureRel),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  return { status: res.status, out: `${res.stdout || ''}${res.stderr || ''}` }
}

test('bad/stale-ref-in-wiki → check-stale-refs FAILs when CANON_STALE_PATTERN matches (exit 2)', () => {
  const { status, out } = runStaleRefs('bad/stale-ref-in-wiki', { CANON_STALE_PATTERN: 'STALE_TOOL_V1' })
  assert.equal(status, 2, out)
  assert.match(out, /Stale references/)
})

test('bad/stale-ref-excluded → check-stale-refs PASSES when match is in exclusion context', () => {
  const { status } = runStaleRefs('bad/stale-ref-excluded', { CANON_STALE_PATTERN: 'STALE_TOOL_V1' })
  assert.equal(status, 0)
})

test('bad/stale-ref-code-block → check-stale-refs PASSES when match is inside a code block', () => {
  const { status } = runStaleRefs('bad/stale-ref-code-block', { CANON_STALE_PATTERN: 'STALE_TOOL_V1' })
  assert.equal(status, 0)
})

// ─── G8: PostToolUse behavioral tests ─────────────────────────────────────────
// post-write-check.sh has two output paths:
//   Advisory — findings/conclusions file not in CONTENT_INDEX → hookSpecificOutput ⚠
//   Block     — wiki/plans file with stale ref → { "decision": "block" }
// The clean path (wiki file, pattern matches nothing) must be silent.

function runPostWrite(fixtureRel, filePath, env = {}) {
  const payload = JSON.stringify({ tool_input: { file_path: filePath } })
  const res = spawnSync('bash', [join(SCRIPTS, 'post-write-check.sh')], {
    cwd: join(FIXTURES, fixtureRel),
    input: payload,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  return { status: res.status, out: `${res.stdout || ''}${res.stderr || ''}` }
}

test('G8: post-write-check: wiki/ file with stale ref → block JSON emitted', { skip: needsPython }, () => {
  const filePath = join(FIXTURES, 'bad/stale-ref-in-wiki', 'wiki/project/decisions.md')
  const { status, out } = runPostWrite('bad/stale-ref-in-wiki', filePath, { CANON_STALE_PATTERN: 'STALE_TOOL_V1' })
  assert.equal(status, 0, out)
  const parsed = JSON.parse(out.trim())
  assert.equal(parsed.decision, 'block')
  assert.match(parsed.reason, /[Ss]tale reference/)
})

test('G8: post-write-check: findings/ file not in index → advisory JSON emitted', { skip: needsPython }, () => {
  const fixtureDir = join(FIXTURES, 'bad/post-write-findings-unindexed')
  const filePath = join(fixtureDir, 'findings/phase-01-poc-01-results.md')
  const { status, out } = runPostWrite('bad/post-write-findings-unindexed', filePath)
  assert.equal(status, 0, out)
  const parsed = JSON.parse(out.trim())
  assert.match(parsed.hookSpecificOutput.additionalContext, /not yet in CONTENT_INDEX/)
})

test('G8: post-write-check: wiki/ file with no pattern match → exits 0, no output', { skip: needsPython }, () => {
  const filePath = join(FIXTURES, 'clean-populated', 'wiki/project/decisions.md')
  const { status, out } = runPostWrite('clean-populated', filePath)
  assert.equal(status, 0)
  assert.equal(out.trim(), '', `unexpected output: ${out}`)
})

test('G8: post-write-check: conclusions/ file not in index → advisory JSON emitted', { skip: needsPython }, () => {
  const fixtureDir = join(FIXTURES, 'bad/post-write-conclusions-unindexed')
  const filePath = join(fixtureDir, 'conclusions/phase-01-poc-01-conclusions.md')
  const { status, out } = runPostWrite('bad/post-write-conclusions-unindexed', filePath)
  assert.equal(status, 0, out)
  const parsed = JSON.parse(out.trim())
  assert.match(parsed.hookSpecificOutput.additionalContext, /not yet in CONTENT_INDEX/)
})

test('G8: post-write-check: Cursor payload shape (tool_input.path) → advisory fires', { skip: needsPython }, () => {
  const fixtureDir = join(FIXTURES, 'bad/post-write-findings-unindexed')
  const filePath = join(fixtureDir, 'findings/phase-01-poc-01-results.md')
  const payload = JSON.stringify({ tool_input: { path: filePath } })
  const res = spawnSync('bash', [join(SCRIPTS, 'post-write-check.sh')], {
    cwd: fixtureDir,
    input: payload,
    encoding: 'utf8',
  })
  assert.equal(res.status, 0, `${res.stdout}${res.stderr}`)
  const parsed = JSON.parse(res.stdout.trim())
  assert.match(parsed.hookSpecificOutput.additionalContext, /not yet in CONTENT_INDEX/)
})

// Behavior flip (basename fix): a prose mention of the filename in CONTENT_INDEX
// used to suppress the advisory (substring match). Registered means a markdown
// link with the full relative path — same contract as check-index (G3).
test('G8: post-write-check: prose-only mention in index → advisory STILL fires', { skip: needsPython }, () => {
  const fixtureDir = join(FIXTURES, 'bad/post-write-prose-mention')
  const filePath = join(fixtureDir, 'findings/notes.md')
  const { status, out } = runPostWrite('bad/post-write-prose-mention', filePath)
  assert.equal(status, 0, out)
  const parsed = JSON.parse(out.trim())
  assert.match(parsed.hookSpecificOutput.additionalContext, /not yet in CONTENT_INDEX/)
})

test('G8: post-write-check: properly registered findings file → silent', { skip: needsPython }, () => {
  const fixtureDir = join(FIXTURES, 'clean-populated')
  const target = readdirSync(join(fixtureDir, 'findings')).find((f) => f.endsWith('.md') && f !== 'README.md')
  const { status, out } = runPostWrite('clean-populated', join(fixtureDir, 'findings', target))
  assert.equal(status, 0)
  assert.equal(out.trim(), '', `registered file must not warn: ${out}`)
})

// ─── check-index mtime branch (advisory ⚠, exit 0) ─────────────────────────────
// A watched file newer than CONTENT_INDEX.md warns that entries may be stale.
// Runs against a temp copy of clean-populated so fixture mtimes stay untouched.

test('check-index mtime: file newer than CONTENT_INDEX → ⚠ warns, exits 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'canon-mtime-'))
  try {
    cpSync(join(FIXTURES, 'clean-populated'), dir, { recursive: true })
    const past = new Date(Date.now() - 60_000)
    utimesSync(join(dir, 'CONTENT_INDEX.md'), past, past)
    const target = readdirSync(join(dir, 'findings')).find((f) => f.endsWith('.md') && f !== 'README.md')
    const now = new Date()
    utimesSync(join(dir, 'findings', target), now, now)

    const res = spawnSync('bash', [join(SCRIPTS, 'check-index.sh')], { cwd: dir, encoding: 'utf8' })
    assert.equal(res.status, 0, `mtime drift is advisory — must exit 0:\n${res.stdout}${res.stderr}`)
    assert.match(res.stdout, /modified after/, 'expected the mtime-drift warning')
    assert.match(res.stdout, new RegExp(`findings/${target}`))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
