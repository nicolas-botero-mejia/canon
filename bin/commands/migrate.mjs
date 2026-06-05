import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync } from 'fs'
import { join, resolve, relative } from 'path'

const USER_DIRS = ['plans', 'findings', 'output', 'raw', 'wiki/project', 'wiki/standards', 'scripts/project']
const FRAMEWORK_SECTION_MARKER = '## Project layer'

export async function run(args) {
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const sourceIdx = args.findIndex(a => a === '--source')
  const source = sourceIdx !== -1 ? resolve(args[sourceIdx + 1]) : null

  if (!source) {
    console.error('Usage: framework migrate --source <path> [--dry-run] [--force]')
    process.exit(1)
  }

  if (!existsSync(source)) {
    console.error(`migrate: source not found: ${source}`)
    process.exit(1)
  }

  const dest = process.cwd()

  if (!existsSync(join(dest, '.framework-version')) && !force) {
    console.error('migrate: destination is not an initialized framework consumer. Run `framework init` first.')
    process.exit(1)
  }

  const label = dryRun ? '[dry-run] ' : ''
  const log = []

  console.log(`\nframework migrate`)
  console.log(`  source: ${source}`)
  console.log(`  dest:   ${dest}`)
  if (dryRun) console.log(`  mode:   dry-run (no files written)\n`)
  else console.log('')

  // ── 1. Copy user dirs ──────────────────────────────────────────────────────
  console.log('── User dirs ──')
  for (const dir of USER_DIRS) {
    const srcDir = join(source, dir)
    const dstDir = join(dest, dir)
    if (!existsSync(srcDir)) {
      console.log(`  skip   ${dir}/ (not in source)`)
      continue
    }
    if (existsSync(dstDir) && !force) {
      // Check if dir has real content (beyond .gitkeep)
      const { readdirSync } = await import('fs')
      const entries = readdirSync(dstDir).filter(e => e !== '.gitkeep' && e !== '.DS_Store')
      if (entries.length > 0) {
        console.log(`  skip   ${dir}/ (destination has content — use --force to overwrite)`)
        continue
      }
    }
    console.log(`  ${label}copy   ${dir}/`)
    if (!dryRun) {
      mkdirSync(dstDir, { recursive: true })
      cpSync(srcDir, dstDir, { recursive: true, force: true })
    }
    log.push(`migrate: copied ${dir}/ from ${source}`)
  }

  // ── 2. Merge CONTENT_INDEX user entries ────────────────────────────────────
  console.log('\n── CONTENT_INDEX ──')
  const srcIndex = join(source, 'CONTENT_INDEX.md')
  const dstIndex = join(dest, 'CONTENT_INDEX.md')

  if (existsSync(srcIndex) && existsSync(dstIndex)) {
    const srcContent = readFileSync(srcIndex, 'utf8')
    const userEntries = extractUserSection(srcContent)

    if (userEntries.trim()) {
      console.log(`  ${label}merge  user entries from source CONTENT_INDEX`)
      if (!dryRun) {
        const dstContent = readFileSync(dstIndex, 'utf8')
        const merged = replaceUserSection(dstContent, userEntries)
        writeFileSync(dstIndex, merged)
      }
      log.push('migrate: merged user entries from source CONTENT_INDEX.md')
    } else {
      console.log('  skip   CONTENT_INDEX (source has no user entries)')
    }
  } else if (!existsSync(srcIndex)) {
    console.log('  skip   CONTENT_INDEX (not in source)')
  }

  // ── 3. Fill CLAUDE.md facts ────────────────────────────────────────────────
  console.log('\n── CLAUDE.md ──')
  const srcClaude = join(source, 'CLAUDE.md')
  const dstClaude = join(dest, 'CLAUDE.md')

  if (existsSync(srcClaude) && existsSync(dstClaude)) {
    const srcFacts = extractSection(readFileSync(srcClaude, 'utf8'), '## Confirmed Client Facts')
    const srcSessions = extractSection(readFileSync(srcClaude, 'utf8'), '## Phase Sessions')

    if (srcFacts || srcSessions) {
      console.log(`  ${label}fill   Confirmed Client Facts + Phase Sessions from source`)
      if (!dryRun) {
        let dstContent = readFileSync(dstClaude, 'utf8')
        if (srcFacts) dstContent = replaceSection(dstContent, '## Confirmed Client Facts', srcFacts)
        if (srcSessions) dstContent = replaceSection(dstContent, '## Phase Sessions', srcSessions)
        writeFileSync(dstClaude, dstContent)
      }
      log.push('migrate: filled Confirmed Client Facts + Phase Sessions in CLAUDE.md')
    } else {
      console.log('  skip   CLAUDE.md (source has no filled fact tables)')
    }
  }

  // ── 4. Append log.md ──────────────────────────────────────────────────────
  console.log('\n── log.md ──')
  const srcLog = join(source, 'log.md')
  const dstLog = join(dest, 'log.md')

  if (existsSync(srcLog)) {
    const srcEntries = extractLogEntries(readFileSync(srcLog, 'utf8'))
    if (srcEntries.trim()) {
      console.log(`  ${label}append prior log entries from source`)
      if (!dryRun) {
        const dstContent = readFileSync(dstLog, 'utf8')
        const migrationNote = `\n---\n\n*Entries below migrated from ${source} on ${new Date().toISOString().slice(0, 10)}*\n\n`
        writeFileSync(dstLog, dstContent + migrationNote + srcEntries)
      }
      log.push(`migrate: appended log entries from ${source}`)
    } else {
      console.log('  skip   log.md (source has no entries)')
    }
  } else {
    console.log('  skip   log.md (not in source)')
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────')
  if (dryRun) {
    console.log('Dry-run complete. Re-run without --dry-run to apply.')
  } else {
    console.log(`✓ Migration complete (${log.length} actions)`)
    console.log(`  Run 'framework doctor' to verify.`)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractUserSection(content) {
  const idx = content.indexOf(FRAMEWORK_SECTION_MARKER)
  if (idx === -1) return ''
  // Everything after the marker heading line
  const afterHeading = content.slice(idx).split('\n').slice(1).join('\n')
  return afterHeading.trim()
}

function replaceUserSection(destContent, userEntries) {
  const idx = destContent.indexOf(FRAMEWORK_SECTION_MARKER)
  if (idx === -1) return destContent + '\n\n' + userEntries
  const headingLine = destContent.slice(idx).split('\n')[0]
  return destContent.slice(0, idx) + headingLine + '\n\n' + userEntries + '\n'
}

function extractSection(content, heading) {
  const idx = content.indexOf('\n' + heading)
  if (idx === -1) return null
  const start = idx + 1
  // Find next ## heading
  const rest = content.slice(start)
  const nextH2 = rest.search(/\n## /)
  const section = nextH2 === -1 ? rest : rest.slice(0, nextH2)
  // Skip if it's still all placeholders
  if (/\[fact\]|\[value\]|\[name\]|\[date\]|\[time\]/.test(section) &&
      !section.match(/\| [^\[|]+\|/)) return null
  return section.trim()
}

function replaceSection(content, heading, replacement) {
  const idx = content.indexOf('\n' + heading)
  if (idx === -1) return content
  const start = idx + 1
  const rest = content.slice(start)
  const nextH2 = rest.search(/\n## /)
  const before = content.slice(0, start)
  const after = nextH2 === -1 ? '' : rest.slice(nextH2)
  return before + replacement + '\n' + after
}

function extractLogEntries(content) {
  // Skip the header (lines before the first --- or first bullet)
  const lines = content.split('\n')
  const firstEntry = lines.findIndex(l => l.startsWith('- **') || l.startsWith('## ['))
  if (firstEntry === -1) return ''
  return lines.slice(firstEntry).join('\n').trim()
}
