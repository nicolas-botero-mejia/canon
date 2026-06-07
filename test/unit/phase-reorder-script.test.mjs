import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const SCRIPT = join(PKG_ROOT, 'lib', 'scripts', 'phase-reorder.sh')

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'canon-reorder-test-'))
}

function makeConsumer(dir) {
  // Create minimal consumer with two phases
  const plans = join(dir, 'plans')
  const findings = join(dir, 'findings')
  const conclusions = join(dir, 'conclusions')
  mkdirSync(plans, { recursive: true })
  mkdirSync(findings, { recursive: true })
  mkdirSync(conclusions, { recursive: true })
  mkdirSync(join(plans, '_archive'), { recursive: true })

  // Phase 02 files
  writeFileSync(join(plans, 'phase-02-index.md'), '# Phase 02\nphase: "02"\n')
  writeFileSync(join(plans, 'phase-02-poc-roadmap.md'), '# Phase 02 POC Roadmap\n')
  writeFileSync(join(findings, 'phase-02-poc-01-test-results.md'), '# Phase 02 results\n**Phase:** 02\n')
  writeFileSync(join(conclusions, 'phase-02-poc-01-test-conclusions.md'), '# Phase 02 conclusions\nphase-02\n')

  // Phase 04 files
  writeFileSync(join(plans, 'phase-04-index.md'), '# Phase 04\nphase: "04"\n')
  writeFileSync(join(findings, 'phase-04-session-01-results.md'), '# Phase 04 session\nphase-04\n')

  // CONTENT_INDEX
  writeFileSync(join(dir, 'CONTENT_INDEX.md'), '## Phase 02\n| phase-02-index.md |\n## Phase 04\n| phase-04-index.md |\n')
  writeFileSync(join(dir, 'CLAUDE.md'), 'Active phase: phase-02\n')
  writeFileSync(join(dir, 'log.md'), '## [2026-01-01] create | plans/ | phase 02 setup\n')
  return { plans, findings, conclusions }
}

function runScript(dir, args) {
  return spawnSync('bash', [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' })
}

test('phase-reorder: --dry-run prints rename plan, no files changed', () => {
  const dir = makeTmp()
  makeConsumer(dir)

  const result = runScript(dir, ['02', '04', '--dry-run'])
  assert.equal(result.status, 0, `Script failed: ${result.stderr}`)
  assert.ok(result.stdout.toLowerCase().includes('dry run'), 'Expected dry run indication in output')
  // Files should not have been renamed
  assert.ok(existsSync(join(dir, 'plans', 'phase-02-index.md')), 'phase-02 files should not be renamed in dry-run')
  assert.ok(existsSync(join(dir, 'plans', 'phase-04-index.md')), 'phase-04 files should not be renamed in dry-run')
})

test('phase-reorder: swaps phase-02 ↔ phase-04 files', () => {
  const dir = makeTmp()
  makeConsumer(dir)

  const result = runScript(dir, ['02', '04'])
  assert.equal(result.status, 0, `Script failed: ${result.stderr}`)

  // phase-02 files should now be named phase-04, and vice versa
  assert.ok(existsSync(join(dir, 'plans', 'phase-04-index.md')), 'plans/phase-04-index.md should exist after swap')
  assert.ok(existsSync(join(dir, 'plans', 'phase-02-index.md')), 'plans/phase-02-index.md should exist after swap (was phase-04)')
  assert.ok(!existsSync(join(dir, 'plans', 'phase-02-poc-roadmap.md')) ||
    existsSync(join(dir, 'plans', 'phase-04-poc-roadmap.md')),
    'phase-02-poc-roadmap.md should have been renamed to phase-04-poc-roadmap.md')
})

test('phase-reorder: appends reorder entry to log.md without modifying history', () => {
  const dir = makeTmp()
  makeConsumer(dir)
  const originalLog = readFileSync(join(dir, 'log.md'), 'utf8')

  runScript(dir, ['02', '04'])

  const newLog = readFileSync(join(dir, 'log.md'), 'utf8')
  assert.ok(newLog.startsWith(originalLog), 'log.md history was modified (not append-only)')
  assert.ok(newLog.includes('reorder'), 'log.md missing new reorder entry')
})

test('phase-reorder: blocks if phase has summary file', () => {
  const dir = makeTmp()
  makeConsumer(dir)
  writeFileSync(join(dir, 'conclusions', 'phase-02-summary.md'), '# Phase 02 summary\n')

  const result = runScript(dir, ['02', '04'])
  assert.equal(result.status, 2, 'Expected exit 2 when phase-02 is concluded')
  assert.ok(result.stdout.includes('concluded') || result.stderr.includes('concluded'),
    'Expected error message about concluded phase')
})

test('phase-reorder: blocks if phase has archive directory', () => {
  const dir = makeTmp()
  makeConsumer(dir)
  mkdirSync(join(dir, 'plans', '_archive', 'phase-02'), { recursive: true })
  writeFileSync(join(dir, 'plans', '_archive', 'phase-02', 'old-plan.md'), '# old\n')

  const result = runScript(dir, ['02', '04'])
  assert.equal(result.status, 2, 'Expected exit 2 when phase has archive directory')
})
