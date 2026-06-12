import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync, writeFileSync, unlinkSync, rmSync, readdirSync, symlinkSync, mkdirSync } from 'node:fs'
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

// ─── issue #15: wiring depth — existence → integrity ────────────────────────────
// Each gap gets both directions (Rule 15): fires on the violation, silent on the
// clean consumer. The clean direction for all of them at once:

test('#15 clean baseline: fresh init produces zero wiring warnings', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const result = runDoctor(dir)
  assert.equal(result.code, 0)
  assert.ok(!result.stdout.includes('⚠'), `fresh init must be warning-free:\n${result.stdout}`)
})

test('#15 drift: hand-edited vendored file → ⚠ advisory, still exit 0', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const skill = readdirSync(join(dir, '.claude', 'skills'))[0]
  const f = join(dir, '.claude', 'skills', skill, 'SKILL.md')
  writeFileSync(f, readFileSync(f, 'utf8') + '\nlocal tweak\n')
  const result = runDoctor(dir)
  assert.equal(result.code, 0, `drift is advisory, must not block:\n${result.stdout}`)
  assert.match(result.stdout, /vendored drift: \.claude\/skills/)
})

test('#15 missing vendored file → ✗ (plain sync restores it), exit non-zero', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const skill = readdirSync(join(dir, '.claude', 'skills'))[0]
  unlinkSync(join(dir, '.claude', 'skills', skill, 'SKILL.md'))
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.match(result.stdout, /vendored incomplete: \.claude\/skills/)
})

test('#15 orphan: file the package does not ship → ⚠ advisory, exit 0', () => {
  const dir = makeTmp()
  initConsumer(dir)
  writeFileSync(join(dir, '.claude', 'skills', 'zz-orphan.md'), 'left behind by an old version\n')
  const result = runDoctor(dir)
  assert.equal(result.code, 0, result.stdout)
  assert.match(result.stdout, /orphaned in \.claude\/skills.*zz-orphan\.md/)
})

test('#15 hooks: clobbered Stop entry in .claude/settings.json → ✗, exit non-zero', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const f = join(dir, '.claude', 'settings.json')
  const settings = JSON.parse(readFileSync(f, 'utf8'))
  delete settings.hooks.Stop
  writeFileSync(f, JSON.stringify(settings, null, 2))
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.match(result.stdout, /Stop hook no longer dispatches to bin\/hook\.sh/)
})

test('#15 hooks: clobbered .cursor/hooks.json (when present) → ✗, exit non-zero', () => {
  const dir = makeTmp()
  initConsumer(dir)
  mkdirSync(join(dir, '.cursor'), { recursive: true })
  writeFileSync(join(dir, '.cursor', 'hooks.json'), '{}')
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.match(result.stdout, /\.cursor\/hooks\.json: SessionStart hook no longer dispatches/)
})

test('#15 symlink: broken .agents/skills → ✗, exit non-zero', () => {
  const dir = makeTmp()
  initConsumer(dir)
  unlinkSync(join(dir, '.agents', 'skills'))
  symlinkSync('../no-such-dir', join(dir, '.agents', 'skills'))
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.match(result.stdout, /\.agents\/skills is a broken symlink/)
})

test('#15 AGENTS.md deleted → ✗, exit non-zero', () => {
  const dir = makeTmp()
  initConsumer(dir)
  unlinkSync(join(dir, 'AGENTS.md'))
  const result = runDoctor(dir)
  assert.notEqual(result.code, 0)
  assert.match(result.stdout, /AGENTS\.md missing/)
})

test('#15 user dirs: deleted conclusions/ → ✗ naming it; deleted tmp/ → ⚠ only', () => {
  const dir = makeTmp()
  initConsumer(dir)
  rmSync(join(dir, 'conclusions'), { recursive: true, force: true })
  const hard = runDoctor(dir)
  assert.notEqual(hard.code, 0)
  assert.match(hard.stdout, /user dir missing: conclusions\//)

  const dir2 = makeTmp()
  initConsumer(dir2)
  rmSync(join(dir2, 'tmp'), { recursive: true, force: true })
  const soft = runDoctor(dir2)
  assert.equal(soft.code, 0, `tmp/ is advisory (consumers gitignore it):\n${soft.stdout}`)
  assert.match(soft.stdout, /tmp\/ missing/)
})
