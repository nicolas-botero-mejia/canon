import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLI = join(PKG_ROOT, 'bin', 'cli.mjs')

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'canon-init-test-'))
}

function runInit(cwd, args = []) {
  return execFileSync(process.execPath, [CLI, 'init', ...args], { cwd, encoding: 'utf8' })
}

function runInitSafe(cwd, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, 'init', ...args], { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
    return { code: 0, stdout }
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

test('creates all USER_DIRS on init', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const expected = [
    'plans', 'findings', 'conclusions', 'raw', 'tmp', 'deliverables',
    'wiki/project', 'wiki/standards', 'wiki/client', 'wiki/user',
    'scripts/project',
  ]
  for (const d of expected) {
    assert.ok(existsSync(join(dir, d)), `missing dir: ${d}`)
  }
})

test('creates .gitignore with canon entries', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const content = readFileSync(join(dir, '.gitignore'), 'utf8')
  for (const entry of ['node_modules/', 'tmp/', '.DS_Store', 'Thumbs.db']) {
    assert.ok(content.includes(entry), `missing gitignore entry: ${entry}`)
  }
})

test('creates .framework-version with correct version string', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const version = readFileSync(join(dir, '.framework-version'), 'utf8').trim()
  const pkgVersion = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version
  assert.equal(version, pkgVersion)
})

test('creates log.md and CONTENT_INDEX.md when absent', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  assert.ok(existsSync(join(dir, 'log.md')))
  assert.ok(existsSync(join(dir, 'CONTENT_INDEX.md')))
})

test('does not overwrite existing log.md or CONTENT_INDEX.md', () => {
  const dir = makeTmp()
  const sentinel = 'USER CONTENT DO NOT OVERWRITE\n'
  writeFileSync(join(dir, 'log.md'), sentinel)
  writeFileSync(join(dir, 'CONTENT_INDEX.md'), sentinel)
  runInit(dir, ['--yes'])
  assert.equal(readFileSync(join(dir, 'log.md'), 'utf8'), sentinel)
  assert.equal(readFileSync(join(dir, 'CONTENT_INDEX.md'), 'utf8'), sentinel)
})

test('--force re-inits without error on already-initialized project', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  assert.doesNotThrow(() => runInit(dir, ['--yes', '--force']))
})

test('missing --force on already-initialized project exits non-zero', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const result = runInitSafe(dir, ['--yes'])
  assert.notEqual(result.code, 0)
})

test('--yes skips prompts and enables Claude layer by default', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  assert.ok(existsSync(join(dir, 'CLAUDE.md')))
  assert.ok(existsSync(join(dir, '.claude', 'settings.json')))
  assert.ok(!existsSync(join(dir, '.cursor', 'hooks.json')), 'cursor should not be enabled by default')
})

test('writes CLAUDE.md with correct @import line when Claude layer enabled', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8')
  assert.ok(content.includes('@node_modules/@nicolas-botero-mejia/canon/lib/CLAUDE.base.md'))
})

test('writes .claude/settings.json with correct hook commands when Claude layer enabled', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'))
  assert.ok(settings.hooks)
  assert.ok(settings.hooks.SessionStart)
  assert.ok(settings.hooks.Stop)
  const stopCmd = settings.hooks.Stop[0].hooks[0].command
  assert.ok(stopCmd.includes('hook.sh Stop'), `stop hook should call hook.sh Stop: ${stopCmd}`)
})

test('does not write .cursor/ files when Cursor layer not enabled', () => {
  const dir = makeTmp()
  runInit(dir, ['--yes'])
  assert.ok(!existsSync(join(dir, '.cursor', 'hooks.json')))
})

// ── ADR-023: init refuses to run inside the canon package repo ──────────────

const CANON_PKG_JSON = JSON.stringify({ name: '@nicolas-botero-mejia/canon', version: '0.0.0' })

test('ADR-023: refuses inside the package repo and leaves it untouched', () => {
  const dir = makeTmp()
  writeFileSync(join(dir, 'package.json'), CANON_PKG_JSON)
  writeFileSync(join(dir, '.gitignore'), 'node_modules/\n')
  const result = runInitSafe(dir, ['--yes'])
  assert.notEqual(result.code, 0)
  assert.match(result.stderr, /package repo/)
  assert.ok(!existsSync(join(dir, 'plans')), 'must not scaffold user dirs')
  assert.ok(!existsSync(join(dir, '.framework-version')), 'must not write the version marker')
  assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), 'node_modules/\n',
    'must not append to the repo .gitignore')
})

test('ADR-023: refusal walks up — subdirectories of the package repo are blocked too', () => {
  const dir = makeTmp()
  writeFileSync(join(dir, 'package.json'), CANON_PKG_JSON)
  const sub = join(dir, 'lib', 'templates')
  mkdirSync(sub, { recursive: true })
  const result = runInitSafe(sub, ['--yes'])
  assert.notEqual(result.code, 0)
  assert.ok(!existsSync(join(sub, 'plans')), 'must not scaffold into the shipped payload')
})

test('ADR-023: a consumer package.json with a different name initializes normally', () => {
  const dir = makeTmp()
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'some-consumer-app', version: '1.0.0' }))
  runInit(dir, ['--yes'])
  assert.ok(existsSync(join(dir, '.framework-version')))
})
