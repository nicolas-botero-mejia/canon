import { cpSync, mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashFile(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex')
}

const SYNC_MANIFEST = '.canon-sync-manifest.json'

function loadSyncManifest(consumerRoot) {
  const p = join(consumerRoot, SYNC_MANIFEST)
  if (!existsSync(p)) return {}
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return {} }
}

function saveSyncManifest(consumerRoot, hashes) {
  writeFileSync(join(consumerRoot, SYNC_MANIFEST), JSON.stringify(hashes, null, 2))
}

// Collect hashes of all files under dir, keyed by path relative to dir
function collectHashes(dir, rel = '', out = {}) {
  const entries = readdirSync(join(dir, rel), { withFileTypes: true })
  for (const entry of entries) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) collectHashes(dir, relPath, out)
    else out[relPath] = hashFile(join(dir, relPath))
  }
  return out
}

// A file is user-modified when its current hash differs from the last-synced hash.
// If no record exists for the file, fall back to comparing against src (conservative).
function findModified(srcDir, destDir, storedHashes, vendorRel, rel = '') {
  const modified = []
  const entries = readdirSync(join(srcDir, rel), { withFileTypes: true })
  for (const entry of entries) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    const destFile = join(destDir, relPath)
    if (entry.isDirectory()) {
      modified.push(...findModified(srcDir, destDir, storedHashes, vendorRel, relPath))
    } else if (existsSync(destFile)) {
      const destHash = hashFile(destFile)
      const manifestKey = `${vendorRel}/${relPath}`
      if (storedHashes[manifestKey] !== undefined) {
        // Known baseline: user-modified iff dest drifted from last-synced hash
        if (destHash !== storedHashes[manifestKey]) modified.push(relPath)
      } else {
        // No baseline: fall back to comparing dest against src (original behaviour)
        if (hashFile(join(srcDir, relPath)) !== destHash) modified.push(relPath)
      }
    }
  }
  return modified
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Vendor all manifest.vendored dirs from lib/ into the consumer project.
 * Skips dirs that contain user-modified files unless { force: true } is passed.
 */
export function vendorDirs(manifest, pkgRoot, consumerRoot, { force = false } = {}) {
  const storedHashes = loadSyncManifest(consumerRoot)
  const updatedHashes = { ...storedHashes }

  for (const rel of manifest.vendored) {
    const src  = join(pkgRoot, 'lib', rel)
    const dest = join(consumerRoot, rel)

    if (!existsSync(src)) continue

    if (!force && existsSync(dest)) {
      const modified = findModified(src, dest, storedHashes, rel)
      if (modified.length > 0) {
        console.warn(`  ⚠  Skipping ${rel} — ${modified.length} user-modified file(s):`)
        modified.forEach(f => console.warn(`     ${f}`))
        console.warn(`     Run with --force to overwrite.`)
        continue
      }
    }

    mkdirSync(dirname(dest), { recursive: true })
    cpSync(src, dest, { recursive: true, force: true })
    console.log(`  ✓  vendored ${rel}`)

    // Record the just-synced hashes as the new baseline
    const synced = collectHashes(src)
    for (const [relPath, hash] of Object.entries(synced)) {
      updatedHashes[`${rel}/${relPath}`] = hash
    }
  }

  saveSyncManifest(consumerRoot, updatedHashes)
}

/**
 * Write the consumer CLAUDE.md skeleton with the @import line.
 * Only writes if CLAUDE.md is absent — never overwrites a user-authored body.
 */
export function writeClaudeMd(consumerRoot, pkgName) {
  const path = join(consumerRoot, 'CLAUDE.md')
  if (existsSync(path)) return
  writeFileSync(path, [
    '# [Project Name] — Project Context',
    '',
    `@node_modules/${pkgName}/lib/CLAUDE.base.md`,
    '',
    '---',
    '',
    '## Confirmed Client Facts',
    '',
    '| Item | Confirmed Value |',
    '|------|----------------|',
    '| [fact] | [value] |',
    '',
    '---',
    '',
    '## Phase Sessions',
    '',
    '| # | Session | Date | Time | Type |',
    '|---|---------|------|------|------|',
    '| 1 | [name] | [date] | [time] | Client / Internal |',
    '',
  ].join('\n'))
}

/**
 * Create or append Canon entries to .gitignore.
 */
export function writeGitignore(consumerRoot) {
  const ENTRIES = ['node_modules/', 'tmp/', '.DS_Store', 'Thumbs.db']
  const gitignorePath = join(consumerRoot, '.gitignore')

  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, '# Canon\n' + ENTRIES.join('\n') + '\n')
    console.log('  ✓  .gitignore created')
  } else {
    const existing = readFileSync(gitignorePath, 'utf8')
    const missing = ENTRIES.filter(e => !existing.includes(e))
    if (missing.length > 0) {
      appendFileSync(gitignorePath, '\n# Canon\n' + missing.join('\n') + '\n')
      console.log(`  ✓  .gitignore — added ${missing.length} Canon entries`)
    }
  }
}

/**
 * Write .claude/settings.json with hooks delegating to the package dispatcher.
 * Overwrites on sync — this is wiring, not user content.
 */
export function writeClaudeSettings(consumerRoot, pkgName) {
  const dir = join(consumerRoot, '.claude')
  mkdirSync(dir, { recursive: true })
  const dispatcher = `node_modules/${pkgName}/bin/hook.sh`
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({
    hooks: {
      SessionStart: [{ hooks: [
        {
          type: 'command',
          command: `date_str=$(date "+%A, %B %d, %Y %H:%M %Z") && echo "{\\"hookSpecificOutput\\": {\\"hookEventName\\": \\"SessionStart\\", \\"additionalContext\\": \\"Current date and time: $date_str\\"}}"`,
          statusMessage: 'Loading session date...',
        },
        {
          type: 'command',
          command: `bash ${dispatcher} SessionStart`,
          statusMessage: 'Loading project state...',
        },
      ]}],
      PostToolUse: [{ matcher: 'Write|Edit', hooks: [{
        type: 'command',
        command: `bash ${dispatcher} PostToolUse`,
        timeout: 30,
        statusMessage: 'Checking for stale references...',
      }]}],
      Stop: [{ hooks: [{
        type: 'command',
        command: `bash ${dispatcher} Stop`,
        statusMessage: 'Verifying knowledge base consistency...',
      }]}],
    },
  }, null, 2))
}

/**
 * Write .cursor/hooks.json delegating to the package dispatcher.
 * Overwrites on sync — wiring, not user content.
 */
export function writeCursorHooks(consumerRoot, pkgName) {
  const dir = join(consumerRoot, '.cursor')
  mkdirSync(dir, { recursive: true })
  const dispatcher = `node_modules/${pkgName}/bin/hook.sh`
  writeFileSync(join(dir, 'hooks.json'), JSON.stringify({
    version: 1,
    hooks: {
      sessionStart: [{ command: `bash ${dispatcher} SessionStart` }],
      postToolUse: [{ command: `bash ${dispatcher} PostToolUse`, matcher: 'Write|StrReplace' }],
      stop: [{ command: `bash ${dispatcher} Stop` }],
    },
  }, null, 2))
}
