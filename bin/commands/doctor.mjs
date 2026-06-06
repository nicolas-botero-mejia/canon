import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { packageRoot, readManifest } from '../lib/paths.mjs'

export async function run(_args) {
  const consumerRoot = process.cwd()
  const PACKAGE_ROOT = packageRoot()
  const errors = []
  const ok = []

  // 1. Package installed
  if (existsSync(PACKAGE_ROOT)) {
    ok.push('package installed')
  } else {
    errors.push('package not found in node_modules')
  }

  // 2. .framework-version present and matches
  const versionFile = join(consumerRoot, '.framework-version')
  const pkgVersion = existsSync(join(PACKAGE_ROOT, 'package.json'))
    ? JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version
    : null

  if (!existsSync(versionFile)) {
    errors.push('.framework-version missing — run `canon sync`')
  } else {
    const recorded = readFileSync(versionFile, 'utf8').trim()
    if (recorded === pkgVersion) {
      ok.push(`.framework-version matches package (${pkgVersion})`)
    } else {
      errors.push(`.framework-version (${recorded}) ≠ package (${pkgVersion}) — run \`canon sync\``)
    }
  }

  // 3. @import line in CLAUDE.md
  const claudeMd = join(consumerRoot, 'CLAUDE.md')
  if (!existsSync(claudeMd)) {
    errors.push('CLAUDE.md missing')
  } else {
    const content = readFileSync(claudeMd, 'utf8')
    if (content.includes('@node_modules/')) {
      ok.push('@import line present in CLAUDE.md')
    } else {
      errors.push('CLAUDE.md has no @import line pointing into node_modules')
    }
  }

  // 4. Vendored dirs present
  const manifest = existsSync(PACKAGE_ROOT) ? readManifest(PACKAGE_ROOT) : { vendored: [] }
  for (const dir of manifest.vendored) {
    const target = join(consumerRoot, dir)
    if (existsSync(target)) {
      ok.push(`vendored: ${dir}`)
    } else {
      errors.push(`vendored dir missing: ${dir} — run \`canon sync\``)
    }
  }

  // 5. Hook dispatcher resolves
  const dispatcher = join(PACKAGE_ROOT, 'bin', 'hook.sh')
  if (existsSync(dispatcher)) {
    ok.push('hook dispatcher resolves')
  } else {
    errors.push('hook dispatcher missing: bin/hook.sh')
  }

  // 6. MCP server (if opted in)
  const claudeSettingsPath = join(consumerRoot, '.claude', 'settings.json')
  if (existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(claudeSettingsPath, 'utf8'))
      if (settings.mcpServers?.canon) {
        const mcpEntry = join(PACKAGE_ROOT, 'bin', 'mcp-server.mjs')
        if (existsSync(mcpEntry)) {
          ok.push('MCP server resolves (bin/mcp-server.mjs)')
        } else {
          errors.push('MCP server missing: bin/mcp-server.mjs — run `canon sync`')
        }
      }
    } catch { /* ignore */ }
  }

  // Report
  for (const msg of ok) console.log(`  ✓ ${msg}`)
  for (const msg of errors) console.log(`  ✗ ${msg}`)

  if (errors.length > 0) {
    console.log(`\ncanon doctor: ${errors.length} issue(s) found`)
    process.exit(1)
  } else {
    console.log(`\ncanon doctor: all checks passed`)
  }
}
