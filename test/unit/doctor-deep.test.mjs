/**
 * doctor-deep.test.mjs — Functional tests for `canon doctor --deep`'s content tier.
 *
 * Exercises the exported runContentChecks() against staged consumer trees (built
 * from test/fixtures/clean-populated) and asserts the three-tier classification:
 *   pass — exit 0, no advisory
 *   warn — exit 0 but emits a ⚠ line (must NOT be swallowed as a pass — the G2 bug)
 *   fail — non-zero exit (blocks)
 *
 * Before this, doctor --deep judged on exit code only, so a Complete conclusion
 * missing its alignment date was reported as ✓. See bin/commands/doctor.mjs.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { CONTENT_CHECKS, runContentChecks } from '../../bin/commands/doctor.mjs'

const PKG = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLEAN = join(PKG, 'test', 'fixtures', 'clean-populated')

let HAS_PYTHON3 = false
try { execSync('command -v python3', { stdio: 'ignore' }); HAS_PYTHON3 = true } catch { /* none */ }
const needsPython = HAS_PYTHON3 ? false : 'python3 not available (check-links can\'t run)'

// Copy the compliant tree to a temp consumer, optionally mutate it, then re-write
// CONTENT_INDEX.md LAST so it is the newest file — this neutralises check-index's
// advisory mtime-staleness warning, keeping an otherwise-clean tree clean.
function stageConsumer(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'canon-doctor-deep-'))
  cpSync(CLEAN, dir, { recursive: true })
  if (mutate) mutate(dir)
  const idx = join(dir, 'CONTENT_INDEX.md')
  writeFileSync(idx, readFileSync(idx, 'utf8'))
  return dir
}

const byScript = (dir) => Object.fromEntries(runContentChecks(dir, PKG).map(r => [r.script, r]))

// ─── G6: the roster doctor runs is the canonical five, in order ────────────────

test('CONTENT_CHECKS roster is the five content scripts in order', () => {
  assert.deepEqual(
    CONTENT_CHECKS.map(c => c[0]),
    ['check-index', 'check-links', 'check-stale-refs', 'check-conclusions-alignment', 'check-contracts']
  )
})

// ─── pass tier ─────────────────────────────────────────────────────────────────

test('runContentChecks: clean-populated → every check passes', { skip: needsPython }, () => {
  for (const r of runContentChecks(stageConsumer(), PKG)) {
    assert.equal(r.tier, 'pass', `${r.script} expected pass:\n${r.out}`)
  }
})

// ─── warn tier (G2): the bug this whole fix exists for ─────────────────────────

test('runContentChecks: Complete conclusion w/ empty alignment date → WARN, not swallowed', { skip: needsPython }, () => {
  const dir = stageConsumer(d => {
    const f = join(d, 'conclusions', 'phase-01-poc-01-conclusions.md')
    writeFileSync(f, readFileSync(f, 'utf8').replace('**Alignment verified:** 2026-06-02', '**Alignment verified:**'))
  })
  const r = byScript(dir)
  assert.equal(r['check-conclusions-alignment'].tier, 'warn', r['check-conclusions-alignment'].out)
  // contracts still passes (the field is present) and nothing else fails — warn is isolated
  assert.equal(r['check-contracts'].tier, 'pass', r['check-contracts'].out)
  for (const [s, res] of Object.entries(r)) {
    if (s !== 'check-conclusions-alignment') assert.notEqual(res.tier, 'fail', `${s}:\n${res.out}`)
  }
})

// ─── fail tier ─────────────────────────────────────────────────────────────────

test('runContentChecks: broken contract (findings missing header) → FAIL', () => {
  const dir = stageConsumer(d => {
    writeFileSync(join(d, 'findings', 'phase-01-poc-01-results.md'), '# No header here\n\nMissing Author and Date.\n')
  })
  assert.equal(byScript(dir)['check-contracts'].tier, 'fail', byScript(dir)['check-contracts'].out)
})
