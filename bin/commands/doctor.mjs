import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { packageRoot, readManifest } from '../lib/paths.mjs'

// The knowledge-base content checks run by `canon doctor --deep`, in order. Exported
// so tests and a roster-completeness scanner can see the canonical set — bin/hook.sh's
// Stop chain must run this same list.
export const CONTENT_CHECKS = [
  ['check-index', 'CONTENT_INDEX up to date'],
  ['check-links', 'markdown links resolve'],
  ['check-stale-refs', 'no stale references'],
  ['check-conclusions-alignment', 'conclusions alignment-verified'],
  ['check-contracts', 'document format contracts'],
  ['check-addendum-integrity', 'addendum model integrity'],
]

// Run each content check and classify it into one of three tiers:
//   fail — script exited non-zero (broken links, contract violations, stale index)
//   warn — exited 0 but emitted an advisory (⚠) line: a Complete conclusion missing
//          its alignment DATE, or an mtime-stale index entry. Real signals that
//          exit-code-only reporting silently dropped.
//   pass — exited 0 with no advisory output
// Returns one {script, label, tier, out} per check, in CONTENT_CHECKS order.
export function runContentChecks(consumerRoot, pkgRoot) {
  return CONTENT_CHECKS.map(([script, label]) => {
    const scriptPath = join(pkgRoot, 'lib', 'scripts', `${script}.sh`)
    const res = spawnSync('bash', [scriptPath], { cwd: consumerRoot, encoding: 'utf8' })
    const out = `${res.stdout || ''}${res.stderr || ''}`.trimEnd()
    const tier = res.status !== 0 ? 'fail' : out.includes('⚠') ? 'warn' : 'pass'
    return { script, label, tier, out }
  })
}

export async function run(args = []) {
  const deep = args.includes('--deep')
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

  // Report wiring/install health
  console.log('Framework wiring:')
  for (const msg of ok) console.log(`  ✓ ${msg}`)
  for (const msg of errors) console.log(`  ✗ ${msg}`)

  // Deep mode: also run the knowledge-base CONTENT checks. The default `canon doctor`
  // only validates that the framework is wired up; content drift (stale index, broken
  // doc links, contract violations) is what a half-finished migration leaves behind, and
  // the wiring checks above can't see it. Three tiers: fail (✗, blocks), warn (⚠,
  // advisory — surfaced but never blocks), pass (✓).
  let contentIssues = 0
  let contentWarnings = 0
  if (deep) {
    console.log('\nContent (knowledge base):')
    for (const { script, label, tier, out } of runContentChecks(consumerRoot, PACKAGE_ROOT)) {
      if (tier === 'pass') {
        console.log(`  ✓ ${label}`)
      } else if (tier === 'warn') {
        contentWarnings++
        console.log(`  ⚠ ${label} (${script}):`)
        for (const line of out.split('\n')) console.log(`      ${line}`)
      } else {
        contentIssues++
        console.log(`  ✗ ${label} (${script}):`)
        for (const line of out.split('\n')) console.log(`      ${line}`)
      }
    }
  }

  // Summary + remediation routing. FAIL tiers (wiring errors, content issues) block
  // with exit 1; WARN tiers are advisory — surfaced, but never block (matching the
  // Stop hook's advisory contract).
  const failed = errors.length > 0 || contentIssues > 0
  if (failed || contentWarnings > 0) {
    console.log('')
  }
  if (errors.length > 0) {
    console.log(`✗ ${errors.length} framework wiring issue(s) → run \`canon sync\``)
  }
  if (contentIssues > 0) {
    console.log(`✗ ${contentIssues} content issue(s) → run \`/knowledge-audit\` to triage & propose fixes`)
  }
  if (contentWarnings > 0) {
    console.log(`⚠ ${contentWarnings} content warning(s) (advisory) → run \`/conclusions-review\` or \`/knowledge-audit\``)
  }
  if (failed) {
    process.exit(1)
  }

  const warnSuffix = contentWarnings > 0 ? `, ${contentWarnings} advisory warning(s)` : ''
  console.log(`\ncanon doctor: all checks passed${deep ? ' (incl. content)' : ''}${warnSuffix}`)
  if (!deep) {
    console.log('  tip: `canon doctor --deep` also audits knowledge-base content (index, links, contracts)')
  }
}
