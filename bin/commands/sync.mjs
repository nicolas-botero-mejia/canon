import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { vendorDirs, writeClaudeSettings, writeCursorHooks } from '../lib/sync-ops.mjs'
import { PKG_NAME, packageRoot, readManifest } from '../lib/paths.mjs'

export async function run(_args) {
  const consumerRoot = process.cwd()
  const PACKAGE_ROOT = packageRoot()

  if (!existsSync(join(consumerRoot, '.framework-version'))) {
    console.error('framework sync: no .framework-version found. Run `framework init` first.')
    process.exit(1)
  }

  const manifest = readManifest(PACKAGE_ROOT)
  const version = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version

  vendorDirs(manifest, PACKAGE_ROOT, consumerRoot)

  // Re-write wiring only if the layer files already exist (don't add layers not opted in)
  const hasClaudeSettings = existsSync(join(consumerRoot, '.claude', 'settings.json'))
  if (hasClaudeSettings) writeClaudeSettings(consumerRoot, PKG_NAME)

  const hasCursorHooks = existsSync(join(consumerRoot, '.cursor', 'hooks.json'))
  if (hasCursorHooks) writeCursorHooks(consumerRoot, PKG_NAME)

  writeFileSync(join(consumerRoot, '.framework-version'), version)

  console.log(`✓ framework synced to ${version}`)
}
