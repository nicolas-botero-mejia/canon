import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export const PKG_NAME = '@nicolas-botero-mejia/canon'

// Resolve the package root from this file's location (bin/lib/paths.mjs → ../../)
export function packageRoot() {
  const here = dirname(fileURLToPath(import.meta.url))
  return join(here, '..', '..')
}

export function readManifest(pkgRoot) {
  return JSON.parse(readFileSync(join(pkgRoot, 'manifest.json'), 'utf8'))
}
