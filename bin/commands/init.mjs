import { createInterface } from 'readline'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { vendorDirs, writeAgentsMd, writeAgentsSymlink, writeGitignore, writeMcpSettings } from '../lib/sync-ops.mjs'
import { PKG_NAME, packageRoot, readManifest } from '../lib/paths.mjs'
import { TOOLS } from '../lib/tools-registry.mjs'

const PACKAGE_ROOT = packageRoot()

// ADR-023: init scaffolds consumer projects. Anywhere inside the canon package
// repo it would scaffold user dirs into the repo (or the shipped lib/ payload)
// and append to the tracked .gitignore — walk up and refuse. A consumer is
// never affected: the installed copy in node_modules is a descendant of the
// consumer root, not an ancestor.
function findPackageRepoRoot(startDir) {
  let dir = resolve(startDir)
  while (true) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        if (JSON.parse(readFileSync(pkgPath, 'utf8')).name === PKG_NAME) return dir
      } catch { /* unparseable package.json — not the package repo */ }
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}
// Exported: doctor's user-dir presence check (issue #15) validates this same list.
export const USER_DIRS = [
  'plans', 'findings', 'conclusions', 'raw', 'tmp', 'deliverables',
  'wiki/project', 'wiki/standards', 'wiki/client', 'wiki/user',
  'scripts/project',
]

async function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

export async function run(args) {
  const yes   = args.includes('--yes')
  const force = args.includes('--force')
  const consumerRoot = process.cwd()

  const repoRoot = findPackageRepoRoot(consumerRoot)
  if (repoRoot) {
    console.error(`canon init: refusing to run inside the canon package repo (${repoRoot}).`)
    console.error('  init scaffolds consumer projects — here it would create user dirs and append to the tracked .gitignore.')
    console.error('  Test init in a scratch dir (cd "$(mktemp -d)"); refresh dogfood wiring with `canon sync`.')
    process.exit(1)
  }

  if (existsSync(join(consumerRoot, '.framework-version')) && !force) {
    console.error('canon init: already initialized. Run with --force to re-init.')
    process.exit(1)
  }

  // Default layers from registry + mcp (protocol layer, not a tool entry)
  const layers = Object.fromEntries(TOOLS.map(t => [t.id, t.defaultEnabled]))
  layers.mcp = false

  if (!yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    for (const tool of TOOLS) {
      const ans = await ask(rl, tool.promptText)
      layers[tool.id] = tool.defaultEnabled
        ? ans.trim().toLowerCase() !== 'n'
        : ans.trim().toLowerCase() === 'y'
    }
    const mcpAns = await ask(rl, 'Enable MCP knowledge server? [y/N] ')
    layers.mcp = mcpAns.trim().toLowerCase() === 'y'
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

  // Per-tool wiring (registry-driven)
  for (const tool of TOOLS) {
    if (layers[tool.id]) tool.writeWiring(consumerRoot, PKG_NAME)
  }

  if (layers.mcp) {
    writeMcpSettings(consumerRoot, PKG_NAME)
  }

  // Cross-tool standards paths — written unconditionally (not per-tool)
  writeAgentsMd(consumerRoot, PKG_NAME, PACKAGE_ROOT)
  writeAgentsSymlink(consumerRoot)

  // Scaffold log and CONTENT_INDEX if absent
  const logPath = join(consumerRoot, 'log.md')
  if (!existsSync(logPath)) writeFileSync(logPath, '# Project Log\n\n')

  const idxPath = join(consumerRoot, 'CONTENT_INDEX.md')
  if (!existsSync(idxPath)) {
    const seed = readFileSync(join(PACKAGE_ROOT, 'lib', 'templates', 'init.content-index-template.md'), 'utf8')
    writeFileSync(idxPath, seed)
  }

  writeFileSync(join(consumerRoot, '.framework-version'), version)

  const layerList = [
    ...TOOLS.filter(t => layers[t.id]).map(t => t.id),
    layers.mcp && 'mcp',
  ].filter(Boolean).join(', ')

  console.log(`✓ canon ${version} initialized`)
  console.log(`  Layers: ${layerList}`)
  console.log(`  Run 'canon doctor' to verify.`)
}
