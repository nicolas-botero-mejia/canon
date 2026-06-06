import { createInterface } from 'readline'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { vendorDirs, writeClaudeMd, writeClaudeSettings, writeCursorHooks, writeGitignore } from '../lib/sync-ops.mjs'
import { PKG_NAME, packageRoot, readManifest } from '../lib/paths.mjs'

const PACKAGE_ROOT = packageRoot()
const USER_DIRS = [
  'plans', 'findings', 'output', 'raw', 'tmp',
  'wiki/project', 'wiki/standards', 'scripts/project',
]

async function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

export async function run(args) {
  const yes   = args.includes('--yes')
  const force = args.includes('--force')
  const consumerRoot = process.cwd()

  if (existsSync(join(consumerRoot, '.framework-version')) && !force) {
    console.error('canon init: already initialized. Run with --force to re-init.')
    process.exit(1)
  }

  let layers = { claude: true, cursor: false }

  if (!yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const claudeAns = await ask(rl, 'Enable Claude Code layer? [Y/n] ')
    layers.claude = claudeAns.trim().toLowerCase() !== 'n'
    const cursorAns = await ask(rl, 'Enable Cursor layer? [y/N] ')
    layers.cursor = cursorAns.trim().toLowerCase() === 'y'
    rl.close()
  }

  // .gitignore — create or append missing entries
  writeGitignore(consumerRoot)

  // Create user dirs
  for (const dir of USER_DIRS) {
    const target = join(consumerRoot, dir)
    if (!existsSync(target)) mkdirSync(target, { recursive: true })
    const keep = join(target, '.gitkeep')
    if (!existsSync(keep)) writeFileSync(keep, '')
  }

  const manifest = readManifest(PACKAGE_ROOT)
  const version = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version

  // Vendor framework dirs and write wiring
  vendorDirs(manifest, PACKAGE_ROOT, consumerRoot, { force })

  if (layers.claude) {
    writeClaudeMd(consumerRoot, PKG_NAME)
    writeClaudeSettings(consumerRoot, PKG_NAME)
  }

  if (layers.cursor) {
    writeCursorHooks(consumerRoot, PKG_NAME)
  }

  // Scaffold log and CONTENT_INDEX if absent
  const logPath = join(consumerRoot, 'log.md')
  if (!existsSync(logPath)) writeFileSync(logPath, '# Project Log\n\n')

  const idxPath = join(consumerRoot, 'CONTENT_INDEX.md')
  if (!existsSync(idxPath)) writeFileSync(idxPath, '# Content Index\n\n')

  writeFileSync(join(consumerRoot, '.framework-version'), version)

  console.log(`✓ canon ${version} initialized`)
  console.log(`  Layers: ${[layers.claude && 'claude', layers.cursor && 'cursor'].filter(Boolean).join(', ')}`)
  console.log(`  Run 'canon doctor' to verify.`)
}
