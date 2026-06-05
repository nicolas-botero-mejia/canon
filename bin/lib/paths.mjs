import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// The package name — placeholder until named in Phase 5
export const PKG_NAME = '@scope/name'

// Resolve the package root from this file's location (bin/lib/paths.mjs → ../../)
export function packageRoot() {
  const here = dirname(fileURLToPath(import.meta.url))
  return join(here, '..', '..')
}

export function readManifest(pkgRoot) {
  return JSON.parse(readFileSync(join(pkgRoot, 'manifest.json'), 'utf8'))
}
