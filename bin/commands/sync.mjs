import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { vendorDirs, writeMcpSettings } from '../lib/sync-ops.mjs'
import { PKG_NAME, packageRoot, readManifest } from '../lib/paths.mjs'
import { TOOLS } from '../lib/tools-registry.mjs'

export async function run(args) {
  const force = args.includes('--force')
  const consumerRoot = process.cwd()
  const PACKAGE_ROOT = packageRoot()

  if (!existsSync(join(consumerRoot, '.framework-version'))) {
    console.error('canon sync: no .framework-version found. Run `canon init` first.')
    process.exit(1)
  }

  const manifest = readManifest(PACKAGE_ROOT)
  const version = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version

  vendorDirs(manifest, PACKAGE_ROOT, consumerRoot, { force })

  // Re-write wiring for each installed tool (registry-driven).
  // A tool is "installed" when its primary wiring file already exists in the consumer —
  // we never add a tool layer that wasn't opted in at init time.
  // MCP opt-in state must be read BEFORE any writeWiring() call that overwrites settings.json.
  const claudeTool = TOOLS.find(t => t.id === 'claude')
  let hadMcpCanon = false
  if (claudeTool?.isInstalled(consumerRoot)) {
    try {
      const prior = JSON.parse(readFileSync(join(consumerRoot, '.claude', 'settings.json'), 'utf8'))
      hadMcpCanon = Boolean(prior.mcpServers?.canon)
    } catch { /* ignore parse errors */ }
  }

  for (const tool of TOOLS) {
    if (tool.isInstalled(consumerRoot)) tool.writeWiring(consumerRoot, PKG_NAME)
  }

  // If MCP was previously opted in, re-apply the mcpServers block after the settings rewrite.
  if (hadMcpCanon) {
    writeMcpSettings(consumerRoot, PKG_NAME)
  }

  writeFileSync(join(consumerRoot, '.framework-version'), version)

  console.log(`✓ canon synced to ${version}`)
}
