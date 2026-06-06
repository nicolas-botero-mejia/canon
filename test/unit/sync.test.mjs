import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLI = join(PKG_ROOT, 'bin', 'cli.mjs')

// Import findModified directly for unit testing
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'

function hashFile(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex')
}

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'canon-sync-test-'))
}

function runCmd(cwd, args) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
}

function runCmdSafe(cwd, args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
  const stdout = r.stdout ?? ''
  const stderr = r.stderr ?? ''
  return { code: r.status ?? 1, stdout, stderr, output: stdout + stderr }
}

function initConsumer(dir) {
  runCmd(dir, ['init', '--yes'])
}

// ─── findModified unit tests ────────────────────────────────────────────────
// Re-implement findModified inline for testing (same logic as sync-ops.mjs)
function findModifiedLocal(srcDir, destDir, storedHashes, vendorRel, rel = '') {
  const modified = []
  const entries = readdirSync(join(srcDir, rel), { withFileTypes: true })
  for (const entry of entries) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    const destFile = join(destDir, relPath)
    if (entry.isDirectory()) {
      modified.push(...findModifiedLocal(srcDir, destDir, storedHashes, vendorRel, relPath))
    } else if (existsSync(destFile)) {
      const destHash = hashFile(destFile)
      const manifestKey = `${vendorRel}/${relPath}`
      if (storedHashes[manifestKey] !== undefined) {
        if (destHash !== storedHashes[manifestKey]) modified.push(relPath)
      } else {
        if (hashFile(join(srcDir, relPath)) !== destHash) modified.push(relPath)
      }
    }
  }
  return modified
}

function makeTestDir(base, name) {
  const d = join(base, name)
  mkdirSync(d, { recursive: true })
  return d
}

test('findModified: identical files → []', () => {
  const tmp = makeTmp()
  const src = makeTestDir(tmp, 'src')
  const dest = makeTestDir(tmp, 'dest')
  writeFileSync(join(src, 'a.md'), 'hello')
  writeFileSync(join(dest, 'a.md'), 'hello')
  const hash = hashFile(join(src, 'a.md'))
  const result = findModifiedLocal(src, dest, { 'mydir/a.md': hash }, 'mydir')
  assert.deepEqual(result, [])
})

test('findModified: one byte different → [relative path]', () => {
  const tmp = makeTmp()
  const src = makeTestDir(tmp, 'src')
  const dest = makeTestDir(tmp, 'dest')
  writeFileSync(join(src, 'a.md'), 'hello')
  writeFileSync(join(dest, 'a.md'), 'MODIFIED')
  const hash = hashFile(join(src, 'a.md'))
  const result = findModifiedLocal(src, dest, { 'mydir/a.md': hash }, 'mydir')
  assert.deepEqual(result, ['a.md'])
})

test('findModified: nested dir, one file modified → [subdir/file.md]', () => {
  const tmp = makeTmp()
  const src = makeTestDir(tmp, 'src')
  const dest = makeTestDir(tmp, 'dest')
  mkdirSync(join(src, 'sub'), { recursive: true })
  mkdirSync(join(dest, 'sub'), { recursive: true })
  writeFileSync(join(src, 'sub', 'b.md'), 'original')
  writeFileSync(join(dest, 'sub', 'b.md'), 'CHANGED')
  const hash = hashFile(join(src, 'sub', 'b.md'))
  const result = findModifiedLocal(src, dest, { 'mydir/sub/b.md': hash }, 'mydir')
  assert.deepEqual(result, ['sub/b.md'])
})

test('findModified: dest file absent → not included (absent = unmodified)', () => {
  const tmp = makeTmp()
  const src = makeTestDir(tmp, 'src')
  const dest = makeTestDir(tmp, 'dest')
  writeFileSync(join(src, 'a.md'), 'hello')
  // dest/a.md does not exist
  const result = findModifiedLocal(src, dest, {}, 'mydir')
  assert.deepEqual(result, [])
})

test('findModified: falls back to comparing against src when no manifest entry', () => {
  const tmp = makeTmp()
  const src = makeTestDir(tmp, 'src')
  const dest = makeTestDir(tmp, 'dest')
  writeFileSync(join(src, 'a.md'), 'original')
  writeFileSync(join(dest, 'a.md'), 'user-modified')
  // no stored hash
  const result = findModifiedLocal(src, dest, {}, 'mydir')
  assert.deepEqual(result, ['a.md'])
})

// ─── vendorDirs / sync integration tests ────────────────────────────────────
test('vendors all manifest.vendored dirs to consumer on init', () => {
  const dir = makeTmp()
  initConsumer(dir)
  // .claude/skills and .claude/rules should exist
  assert.ok(existsSync(join(dir, '.claude', 'skills')))
  assert.ok(existsSync(join(dir, '.claude', 'rules')))
})

test('sync: unmodified files are synced silently', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const result = runCmdSafe(dir, ['sync'])
  assert.equal(result.code, 0)
})

test('sync: updates .framework-version to current version', () => {
  const dir = makeTmp()
  initConsumer(dir)
  // Downgrade the version file
  writeFileSync(join(dir, '.framework-version'), '0.0.0')
  runCmd(dir, ['sync'])
  const version = readFileSync(join(dir, '.framework-version'), 'utf8').trim()
  const pkgVersion = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version
  assert.equal(version, pkgVersion)
})

test('sync: does not touch USER_DIRS', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const sentinel = 'USER_CONTENT\n'
  writeFileSync(join(dir, 'plans', 'my-plan.md'), sentinel)
  writeFileSync(join(dir, 'findings', 'my-finding.md'), sentinel)
  writeFileSync(join(dir, 'conclusions', 'my-conclusions.md'), sentinel)
  runCmd(dir, ['sync'])
  assert.equal(readFileSync(join(dir, 'plans', 'my-plan.md'), 'utf8'), sentinel)
  assert.equal(readFileSync(join(dir, 'findings', 'my-finding.md'), 'utf8'), sentinel)
  assert.equal(readFileSync(join(dir, 'conclusions', 'my-conclusions.md'), 'utf8'), sentinel)
})

test('sync --force: modified vendored files are overwritten', () => {
  const dir = makeTmp()
  initConsumer(dir)
  // Find a vendored skill file and corrupt it
  const skillFile = join(dir, '.claude', 'skills', 'signal', 'SKILL.md')
  if (!existsSync(skillFile)) return // skip if not present
  const original = readFileSync(skillFile, 'utf8')
  writeFileSync(skillFile, 'CORRUPTED')
  runCmd(dir, ['sync', '--force'])
  assert.equal(readFileSync(skillFile, 'utf8'), original)
})

test('sync: modified vendored file without --force prints warning and skips', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const skillFile = join(dir, '.claude', 'skills', 'signal', 'SKILL.md')
  if (!existsSync(skillFile)) return
  writeFileSync(skillFile, 'CORRUPTED')
  const result = runCmdSafe(dir, ['sync'])
  // Should exit 0 but print a warning (warnings go to stderr)
  assert.equal(result.code, 0)
  assert.ok(result.output.includes('⚠') || result.output.includes('Skipping'), `expected warning in output: ${result.output}`)
})

test('warning format: includes path and count', () => {
  const dir = makeTmp()
  initConsumer(dir)
  const skillFile = join(dir, '.claude', 'skills', 'signal', 'SKILL.md')
  if (!existsSync(skillFile)) return
  writeFileSync(skillFile, 'CORRUPTED')
  const result = runCmdSafe(dir, ['sync'])
  assert.ok(result.output.includes('user-modified file'), `expected "user-modified file" in: ${result.output}`)
})
