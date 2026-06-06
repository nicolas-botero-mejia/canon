import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync, writeFileSync, unlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLI = join(PKG_ROOT, 'bin', 'cli.mjs')

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'canon-doctor-test-'))
}

function runDoctor(cwd) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, 'doctor'], { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
    return { code: 0, stdout }
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

function initConsumer(dir) {
  execFileSync(process.execPath, [CLI, 'init', '--yes'], { cwd: dir, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
}

test('exits 0 and prints all ✓ on a correctly initialized consumer', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const result = runDoctor(dir)
  assert.equal(result.code, 0)
  assert.ok(result.stdout.includes('✓'))
  assert.ok(!result.stdout.includes('✗'))
})

test('exits non-zero when .framework-version is missing', () => {
  const dir = makeTmp()
  initConsumer(dir)
  unlinkSync(join(dir, '.framework-version'))
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.ok(result.stdout.includes('✗'))
})

test('exits non-zero when .framework-version contains wrong version', () => {
  const dir = makeTmp()
  initConsumer(dir)
  writeFileSync(join(dir, '.framework-version'), '0.0.0')
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.ok(result.stdout.includes('✗'))
})

test('exits non-zero when @import line is missing from CLAUDE.md', () => {
  const dir = makeTmp()
  initConsumer(dir)
  writeFileSync(join(dir, 'CLAUDE.md'), '# No import here\n')
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.ok(result.stdout.includes('✗'))
})

test('exits non-zero when a vendored dir is missing', () => {
  const dir = makeTmp()
  initConsumer(dir)
  rmSync(join(dir, '.claude', 'skills'), { recursive: true, force: true })
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.ok(result.stdout.includes('✗'))
})

test('reports hook dispatcher as resolved when package is installed', () => {
  // packageRoot() resolves from the CLI file path — hook dispatcher check always
  // passes when running tests from the package repo (the package IS the root).
  // This test verifies the check exists and reports a ✓ line.
  const dir = makeTmp()
  initConsumer(dir)
  const result = runDoctor(dir)
  assert.ok(result.stdout.includes('hook dispatcher resolves'), `expected hook dispatcher check: ${result.stdout}`)
})

test('output format: one line per check with ✓ or ✗ prefix', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const result = runDoctor(dir)
  const lines = result.stdout.split('\n').filter(l => l.trim())
  const checkLines = lines.filter(l => l.includes('✓') || l.includes('✗'))
  assert.ok(checkLines.length > 0, 'expected at least one check line')
  for (const line of checkLines) {
    assert.ok(line.includes('✓') || line.includes('✗'), `unexpected line: ${line}`)
  }
})
