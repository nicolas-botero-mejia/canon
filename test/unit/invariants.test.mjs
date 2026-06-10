/**
 * invariants.test.mjs — Cross-location agreement tests
 *
 * Each test corresponds to a row in lib/wiki/system-invariants.md.
 * These tests check *agreement* between locations, not just *existence*.
 * Run RED first against the drifted codebase, then fix drift (batch 2C/2D),
 * then drive to GREEN.
 *
 * RED assertions are marked with: // RED: currently fails — [reason]
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PKG = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const read = (rel) => readFileSync(join(PKG, rel), 'utf8')

// ─── R-001: Synthesis folder = conclusions/ ──────────────────────────────────

test('R-001: behavioral.mdc Rule 6 routes to conclusions/, not output/', () => {
  const mdc = read('lib/.cursor/rules/behavioral.mdc')
  // Rule 6 routing line — must say conclusions/
  const rule6 = mdc.match(/### 6\. File Routing[\s\S]*?(?=### 7\.)/)?.[0] ?? ''
  assert.ok(
    rule6.includes('conclusions/'),
    'behavioral.mdc Rule 6 must reference conclusions/ (currently says output/)'
  )
  assert.ok(
    !rule6.includes('synthesized conclusions → `output/`'),
    'behavioral.mdc Rule 6 still has stale output/ reference'
  )
})

test('R-001: session-start-report.sh counts conclusions/, not output/', () => {
  const sh = read('lib/scripts/session-start-report.sh')
  assert.ok(
    !sh.includes('count_md "output"'),
    'session-start-report.sh must count conclusions/, not output/ (line ~21)'
  )
  assert.ok(
    sh.includes('count_md "conclusions"'),
    'session-start-report.sh must call count_md "conclusions"'
  )
})

test('R-001: watch-project.sh watches conclusions/, not output/', () => {
  const sh = read('lib/scripts/watch-project.sh')
  assert.ok(
    !sh.includes('"$PROJECT_ROOT/output"'),
    'watch-project.sh must watch conclusions/, not output/'
  )
  assert.ok(
    sh.includes('"$PROJECT_ROOT/conclusions"'),
    'watch-project.sh must include "$PROJECT_ROOT/conclusions" in watch paths'
  )
})

// ─── R-002: Roadmap status vocabulary ────────────────────────────────────────

test('R-002: poc-roadmap-template.md defines the canonical status values', () => {
  const tpl = read('lib/templates/poc-roadmap-template.md')
  for (const status of ['🔜 Planned', '⏳ In Progress', '✅ Complete', 'Deprecated', 'Migrated →']) {
    assert.ok(tpl.includes(status), `poc-roadmap-template.md missing status value: "${status}"`)
  }
})

test('R-002: check-contracts.sh allows the same status values as the template', () => {
  const sh = read('lib/scripts/check-contracts.sh')
  // check-contracts.sh grep allows these via regex — verify it includes the core emojis
  for (const token of ['🔜', '⏳', '✅', 'Deprecated', 'Migrated']) {
    assert.ok(sh.includes(token), `check-contracts.sh missing status token: "${token}"`)
  }
})

// ─── R-003: POC roadmap table columns = 6 ────────────────────────────────────

test('R-003: poc-roadmap-template.md has 6 columns (POC #, Name, Status, Prerequisite, Sessions, Decisions it closes)', () => {
  const tpl = read('lib/templates/poc-roadmap-template.md')
  const headerLine = tpl.split('\n').find(l => l.includes('| POC #') || l.includes('| POC|'))
  assert.ok(headerLine, 'poc-roadmap-template.md missing POC table header row')
  const cols = headerLine.split('|').filter(c => c.trim())
  assert.strictEqual(cols.length, 6, `Template header has ${cols.length} columns, expected 6`)
})

test('R-003: system-architecture.md §9 mentions Sessions and Decisions it closes columns', () => {
  const arch = read('lib/wiki/system-architecture.md')
  const section9 = arch.match(/## 9\. Parsing Contracts[\s\S]*?(?=## \d+\.)/)?.[0] ?? arch.match(/## 9\. Parsing Contracts[\s\S]*/)?.[0] ?? ''
  assert.ok(
    section9.includes('Sessions'),
    'system-architecture.md §9 must list Sessions as a required roadmap column (currently missing — §9 says 4 cols, template has 6)'
  )
  assert.ok(
    section9.includes('Decisions it closes'),
    'system-architecture.md §9 must list "Decisions it closes" column (currently missing)'
  )
})

test('R-003: mcp-reader.mjs readPocRoadmap reads 6 columns including sessions and decisions', () => {
  const mcp = read('bin/lib/mcp-reader.mjs')
  const fn = mcp.match(/function readPocRoadmap[\s\S]*?^}/m)?.[0] ??
             mcp.match(/readPocRoadmap[\s\S]*?\n}/)?.[0] ?? ''
  assert.ok(
    mcp.includes('sessions') || mcp.includes('Sessions'),
    'mcp-reader.mjs readPocRoadmap must parse the sessions column (currently reads only 4 cols)'
  )
  assert.ok(
    mcp.includes('decisions') || mcp.includes('Decisions'),
    'mcp-reader.mjs readPocRoadmap must parse the decisions column (currently silently discards it)'
  )
})

// ─── R-005: Audit dimensions — 15 total, librarian = 8 core subset ───────────

test('R-005: knowledge-audit SKILL.md declares 15 dimensions', () => {
  const ka = read('lib/.claude/skills/knowledge-audit/SKILL.md')
  assert.ok(
    ka.includes('15'),
    'knowledge-audit SKILL.md must declare 15 audit dimensions'
  )
})

test('R-005: librarian.md explicitly cross-references the 15 knowledge-audit dimensions', () => {
  const lib = read('lib/.claude/agents/librarian.md')
  assert.ok(
    lib.includes('knowledge-audit') || lib.includes('15'),
    'librarian.md must reference knowledge-audit as the superset (its 8 dimensions are a subset of the 15)'
  )
})

// ─── R-006: Behavioral rule count = 19 ───────────────────────────────────────

test('R-006: behavioral.md has exactly 19 numbered rules', () => {
  const md = read('lib/.claude/rules/behavioral.md')
  const rules = [...md.matchAll(/^### \d+\./gm)]
  assert.strictEqual(rules.length, 19, `behavioral.md has ${rules.length} rules, expected 19`)
})

test('R-006: behavioral.mdc has exactly 19 numbered rules (mirror agreement)', () => {
  const mdc = read('lib/.cursor/rules/behavioral.mdc')
  const rules = [...mdc.matchAll(/^### \d+\./gm)]
  assert.strictEqual(rules.length, 19, `behavioral.mdc has ${rules.length} rules, expected 19 (mirror of behavioral.md)`)
})

test('R-006: system-architecture.md §1.2 rule count matches behavioral.md', () => {
  const arch = read('lib/wiki/system-architecture.md')
  // §1.2 references the rule count in the session lifecycle diagram
  assert.ok(
    arch.includes('19 rules') || arch.match(/behavioral\.md \(\d+ rules\)/),
    'system-architecture.md §1.2 must reference the current rule count (19)'
  )
})

// ─── R-012: wiki/meta/ paths removed after ADR-007 ───────────────────────────

test('R-012: behavioral.mdc has no wiki/meta/ paths (ADR-007 flattened to wiki/)', () => {
  const mdc = read('lib/.cursor/rules/behavioral.mdc')
  const occurrences = (mdc.match(/wiki\/meta\//g) ?? []).length
  assert.strictEqual(
    occurrences, 0,
    `behavioral.mdc has ${occurrences} occurrences of wiki/meta/ — all should be wiki/ after ADR-007`
  )
})

test('R-012: behavioral.md has no wiki/meta/ paths', () => {
  const md = read('lib/.claude/rules/behavioral.md')
  const occurrences = (md.match(/wiki\/meta\//g) ?? []).length
  assert.strictEqual(occurrences, 0, `behavioral.md has ${occurrences} occurrences of wiki/meta/`)
})

// ─── R-006 / R-012: behavioral.md ↔ behavioral.mdc mirror agreement ──────────

test('R-006 mirror: each rule number in behavioral.md has a corresponding entry in behavioral.mdc', () => {
  const md = read('lib/.claude/rules/behavioral.md')
  const mdc = read('lib/.cursor/rules/behavioral.mdc')
  const mdRules = [...md.matchAll(/^### (\d+)\./gm)].map(m => m[1])
  for (const num of mdRules) {
    assert.ok(
      mdc.includes(`### ${num}.`),
      `behavioral.mdc missing rule ### ${num}. (present in behavioral.md)`
    )
  }
})

// ─── R-007: Canonical skill list — directory is source of truth ───────────────

test('R-007: all skills listed in behavioral.md Rule 14 table exist as directories', () => {
  const md = read('lib/.claude/rules/behavioral.md')
  // Extract skill names from Rule 14 table — look for /skill-name patterns
  const skillRefs = [...md.matchAll(/`\/([a-z-]+(?: [a-z]+)?)`/g)].map(m => m[1].split(' ')[0])
  const uniqueSkills = [...new Set(skillRefs)]
  const SKILLS_DIR = join(PKG, 'lib', '.claude', 'skills')
  for (const skill of uniqueSkills) {
    const skillPath = join(SKILLS_DIR, skill, 'SKILL.md')
    if (existsSync(join(SKILLS_DIR, skill))) {
      assert.ok(existsSync(skillPath), `Skill /${skill} listed in Rule 14 but ${skill}/SKILL.md missing`)
    }
  }
})

// ─── R-008: Addendum model (ADR-010) ─────────────────────────────────────────

test('R-008: activity-conclude SKILL.md implements addendum-append model (ADR-010)', () => {
  const skill = read('lib/.claude/skills/activity-conclude/SKILL.md')
  assert.ok(
    skill.includes('Addendum') || skill.includes('addendum'),
    'activity-conclude/SKILL.md must implement the addendum-append model (ADR-010)'
  )
})

// ─── R-011: Stop hook advisory — no exit 2 blocking claim in docs ─────────────

test('R-011: system-tool-integration.md Stop row says advisory only (not blocking)', () => {
  const sti = read('lib/wiki/system-tool-integration.md')
  // Find the Stop row in the lifecycle events table and verify it says advisory
  assert.ok(
    sti.includes('advisory only') || sti.includes('Advisory'),
    'system-tool-integration.md must describe Stop event as advisory only (see ADR-013)'
  )
  assert.ok(
    !sti.includes('Yes — exit 2 blocks close'),
    'system-tool-integration.md must not claim Stop event blocks with exit 2 (stale claim)'
  )
})

// ─── SKILL.md standard compliance ────────────────────────────────────────────
// Verify all framework SKILL.md files pass the open standard spec (agentskills.io)

import { readdirSync, statSync } from 'node:fs'

const SKILLS_DIR = join(PKG, 'lib', '.claude', 'skills')
const skillDirs = readdirSync(SKILLS_DIR).filter(d =>
  statSync(join(SKILLS_DIR, d)).isDirectory()
)

// ─── R-009: Template naming comments match template-index ────────────────────
// template-index is canonical. Template comment lines must agree.
// Violations found: poc.plan says -session.md; poc.results says -notes.md;
// research.results has reversed pattern [topic]-research instead of research-[topic]-results

test('R-009: poc.plan-template naming comment says -plan.md (not -session.md)', () => {
  const t = read('lib/templates/poc.plan-template.md')
  assert.ok(
    !t.includes('-session.md'),
    'poc.plan-template.md naming comment says "-session.md" — template-index says "-plan.md"'
  )
  assert.ok(
    t.includes('-plan.md'),
    'poc.plan-template.md naming comment must contain "-plan.md" to match template-index'
  )
})

test('R-009: poc.results-template naming comment says -results.md (not -notes.md)', () => {
  const t = read('lib/templates/poc.results-template.md')
  assert.ok(
    !t.includes('-notes.md'),
    'poc.results-template.md naming comment says "-notes.md" — template-index says "-results.md"'
  )
  assert.ok(
    t.includes('-results.md'),
    'poc.results-template.md naming comment must contain "-results.md" to match template-index'
  )
})

test('R-009: research.results-template naming comment matches template-index (research-[topic]-results.md)', () => {
  const t = read('lib/templates/research.results-template.md')
  assert.ok(
    !t.includes('[topic]-research'),
    'research.results-template.md naming comment uses reversed "[topic]-research" pattern — template-index says "research-[topic]-results.md"'
  )
  assert.ok(
    t.includes('research-') && t.includes('-results.md'),
    'research.results-template.md naming comment must match template-index pattern: phase-NN-research-[topic]-results.md'
  )
})

// ─── ADR-016: no checked-in consumer reference — pin the init wiring sources ──
// examples/consumer/ was removed (ADR-016). Init output is verified end-to-end in
// test/integration/update-safety.sh; these guards pin the wiring *sources* so a
// refactor can't silently drop a wiring step.

test('ADR-016: init.mjs writes AGENTS.md and the .agents/skills symlink', () => {
  const s = read('bin/commands/init.mjs')
  assert.ok(s.includes('writeAgentsMd('), 'init.mjs must call writeAgentsMd — AGENTS.md is unconditional cross-tool wiring')
  assert.ok(s.includes('writeAgentsSymlink('), 'init.mjs must call writeAgentsSymlink — .agents/skills covers Codex/Gemini hosts')
})

test('ADR-016: init.mjs seeds CONTENT_INDEX.md from the shipped template', () => {
  const s = read('bin/commands/init.mjs')
  assert.ok(
    s.includes('init.content-index-template.md'),
    'init.mjs must write CONTENT_INDEX.md from lib/templates/init.content-index-template.md (ADR-016 salvaged the framework-layer entries into init)'
  )
  assert.ok(
    existsSync(join(PKG, 'lib/templates/init.content-index-template.md')),
    'lib/templates/init.content-index-template.md missing — init would crash writing the index seed'
  )
})

// ─── PROJECT_ROOT runtime fix ─────────────────────────────────────────────────
// session-start-report.sh and watch-project.sh use dirname "$0" which resolves
// to the package root inside node_modules, not the consumer project root.
// Fix: use $(pwd) — hooks always run from the consumer project root as cwd.

test('PROJECT_ROOT: session-start-report.sh does not use dirname "$0" pattern', () => {
  const s = read('lib/scripts/session-start-report.sh')
  assert.ok(
    !s.includes('"$(dirname "$0"'),
    'session-start-report.sh uses dirname "$0" which resolves to the package root (node_modules), not the consumer root. Use $(pwd) instead.'
  )
})

test('PROJECT_ROOT: watch-project.sh does not use dirname "$0" pattern', () => {
  const s = read('lib/scripts/watch-project.sh')
  assert.ok(
    !s.includes('"$(dirname "$0"'),
    'watch-project.sh uses dirname "$0" which resolves to the package root (node_modules), not the consumer root. Use $(pwd) instead.'
  )
})

// ─── Cursor PostToolUse path field ───────────────────────────────────────────
// Cursor sends tool_input.path (not .file_path). The unified post-write-check.sh
// must handle both fields or Cursor users get no stale-ref feedback on writes.

test('Cursor PostToolUse: post-write-check.sh reads both path and file_path fields', () => {
  const s = read('lib/scripts/post-write-check.sh')
  assert.ok(
    s.includes("'path'") || s.includes('"path"'),
    'lib/scripts/post-write-check.sh must handle Cursor\'s "path" field (tool_input.path), not only "file_path"'
  )
})

// ─── Phase synthesis filename (R-013) ────────────────────────────────────────
// Canonical: conclusions/phase-NN-summary.md — used by phase-conclude, phase-deprecate,
// phase-update, activity-deprecate, phase-reorder skills + phase-reorder.sh (6 sources).
// Drift: system-operations.md says phase-NN-conclusions.md; phase-index-template.md
// says phase-NN-synthesis-conclusions.md; pm.md says phase-NN-conclusions.md.

test('R-013: system-operations.md uses phase-NN-summary.md for phase synthesis file', () => {
  const s = read('lib/wiki/system-operations.md')
  assert.ok(
    !s.includes('phase-NN-conclusions.md'),
    'system-operations.md says "phase-NN-conclusions.md" for phase synthesis — canonical is "phase-NN-summary.md" (used by phase-conclude and 5 other skills)'
  )
})

test('R-013: phase-index-template.md uses phase-NN-summary.md not synthesis-conclusions', () => {
  const s = read('lib/templates/phase-index-template.md')
  assert.ok(
    !s.includes('synthesis-conclusions'),
    'phase-index-template.md says "synthesis-conclusions.md" — canonical is phase-NN-summary.md'
  )
  assert.ok(
    s.includes('summary.md'),
    'phase-index-template.md checklist must reference the canonical phase-NN-summary.md filename'
  )
})

test('R-013: pm.md uses phase-NN-summary.md not phase-NN-conclusions.md', () => {
  const s = read('lib/.claude/agents/pm.md')
  assert.ok(
    !s.includes('phase-NN-conclusions.md'),
    'pm.md says "phase-NN-conclusions.md" for phase synthesis — canonical is "phase-NN-summary.md"'
  )
})

// ─── R-004: Alignment dual-field ─────────────────────────────────────────────
// Templates have both **Alignment verified:** (body) and alignment_verified (YAML).
// Skills must instruct setting BOTH or MCP reports all concluded activities as unverified.

test('R-004: activity-conclude/SKILL.md instructs setting YAML alignment_verified field', () => {
  const s = read('lib/.claude/skills/activity-conclude/SKILL.md')
  assert.ok(
    s.includes('alignment_verified:'),
    'activity-conclude/SKILL.md must instruct setting YAML alignment_verified: "YYYY-MM-DD" in frontmatter (MCP reads YAML; body-only sets leave MCP reporting unverified)'
  )
})

test('R-004: conclusions-review/SKILL.md instructs setting YAML alignment_verified field', () => {
  const s = read('lib/.claude/skills/conclusions-review/SKILL.md')
  assert.ok(
    s.includes('alignment_verified:'),
    'conclusions-review/SKILL.md must instruct setting YAML alignment_verified: "YYYY-MM-DD" in frontmatter (MCP reads YAML; body-only leaves MCP reporting unverified)'
  )
})

// ─── Skill residue ────────────────────────────────────────────────────────────

test('phase-conclude/SKILL.md: no hardcoded "Session 8" reference', () => {
  const s = read('lib/.claude/skills/phase-conclude/SKILL.md')
  assert.ok(
    !s.includes('Session 8'),
    'phase-conclude/SKILL.md contains hardcoded "Session 8" — project-specific residue, not a generic skill instruction'
  )
})

test('phase-conclude/SKILL.md: says 15-dimension audit not 11', () => {
  const s = read('lib/.claude/skills/phase-conclude/SKILL.md')
  assert.ok(
    !s.includes('11-dimension'),
    'phase-conclude/SKILL.md says "11-dimension audit" — knowledge-audit has 15 dimensions (R-005 canonical)'
  )
})

test('activity-new/SKILL.md: alignment check uses /conclusions-review, not /activity-conclude poc', () => {
  const s = read('lib/.claude/skills/activity-new/SKILL.md')
  // Alignment check context: loading prior CONCLUDED conclusions files.
  // Concluded = immutable (Rule 16). /activity-conclude poc re-concludes — wrong.
  // /conclusions-review is the correct fix for a missing alignment date.
  const idx = s.indexOf('Alignment verified:')
  if (idx !== -1) {
    const block = s.slice(Math.max(0, idx - 100), idx + 400)
    assert.ok(
      !block.includes('/activity-conclude poc'),
      'activity-new/SKILL.md alignment check suggests /activity-conclude poc — concluded files are immutable (Rule 16); use /conclusions-review'
    )
  }
})

test('behavioral.md Rule 14: lists /signal, /phase-new, /phase-conclude', () => {
  const s = read('lib/.claude/rules/behavioral.md')
  const rule14 = s.slice(s.indexOf('### 14.'))
  assert.ok(rule14.includes('/signal'), 'behavioral.md Rule 14 missing /signal')
  assert.ok(rule14.includes('/phase-new'), 'behavioral.md Rule 14 missing /phase-new')
  assert.ok(rule14.includes('/phase-conclude'), 'behavioral.md Rule 14 missing /phase-conclude')
})

test('behavioral.mdc Rule 14: lists /signal, /phase-new, /phase-conclude (mirror)', () => {
  const s = read('lib/.cursor/rules/behavioral.mdc')
  const rule14 = s.slice(s.indexOf('### 14.'))
  assert.ok(rule14.includes('/signal'), 'behavioral.mdc Rule 14 missing /signal (must mirror behavioral.md)')
  assert.ok(rule14.includes('/phase-new'), 'behavioral.mdc Rule 14 missing /phase-new (must mirror behavioral.md)')
  assert.ok(rule14.includes('/phase-conclude'), 'behavioral.mdc Rule 14 missing /phase-conclude (must mirror behavioral.md)')
})

test('Cursor wiring: writeCursorHooks delegates to bin/hook.sh, not wrapper scripts', () => {
  const s = read('bin/lib/sync-ops.mjs')
  const start = s.indexOf('export function writeCursorHooks')
  assert.ok(start !== -1, 'writeCursorHooks not found in bin/lib/sync-ops.mjs')
  const end = s.indexOf('export function', start + 1)
  const fn = s.slice(start, end === -1 ? undefined : end)
  assert.ok(fn.includes('bin/hook.sh'), 'writeCursorHooks must wire hooks.json to the package dispatcher (bin/hook.sh)')
  assert.ok(!fn.includes('.cursor/hooks/'), 'writeCursorHooks must not point hooks.json at vendored wrapper scripts (.cursor/hooks/)')
})

test('system-architecture.md: Stop hooks not described as "blocks on exit 2" (ADR-013)', () => {
  const s = read('lib/wiki/system-architecture.md')
  assert.ok(
    !s.includes('[auto, blocks on exit 2]'),
    'system-architecture.md lifecycle diagram says Stop hooks "blocks on exit 2" — ADR-013: Stop is advisory only, always exits 0'
  )
})

// ─── SKILL.md standard compliance ────────────────────────────────────────────
// Verify all framework SKILL.md files pass the open standard spec (agentskills.io)

for (const skillName of skillDirs) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md')

  test(`SKILL.md spec: ${skillName}/SKILL.md exists`, () => {
    assert.ok(existsSync(skillPath), `${skillName}/SKILL.md missing`)
  })

  if (!existsSync(skillPath)) continue
  const content = readFileSync(skillPath, 'utf8')
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)

  test(`SKILL.md spec: ${skillName} has YAML frontmatter`, () => {
    assert.ok(fmMatch, `${skillName}/SKILL.md missing YAML frontmatter (required by agentskills.io spec)`)
  })

  if (!fmMatch) continue
  const fm = fmMatch[1]

  test(`SKILL.md spec: ${skillName} frontmatter has name field`, () => {
    assert.ok(/^name:/m.test(fm), `${skillName}/SKILL.md frontmatter missing required 'name' field`)
  })

  test(`SKILL.md spec: ${skillName} frontmatter has description field`, () => {
    assert.ok(/^description:/m.test(fm), `${skillName}/SKILL.md frontmatter missing required 'description' field`)
  })

  test(`SKILL.md spec: ${skillName} name matches directory name`, () => {
    const nameMatch = fm.match(/^name:\s*(.+)$/m)
    if (nameMatch) {
      assert.strictEqual(
        nameMatch[1].trim(),
        skillName,
        `${skillName}/SKILL.md 'name' field "${nameMatch[1].trim()}" must match directory name "${skillName}"`
      )
    }
  })

  test(`SKILL.md spec: ${skillName} name is lowercase + hyphens only`, () => {
    const nameMatch = fm.match(/^name:\s*(.+)$/m)
    if (nameMatch) {
      const name = nameMatch[1].trim()
      assert.match(
        name,
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
        `${skillName}/SKILL.md name "${name}" must be lowercase letters, numbers, hyphens only (agentskills.io spec)`
      )
    }
  })
}

// ─── ADR-005 / ADR-011: CLI surface + tooling decisions ───────────────────────

test('ADR-005: migrate command absent from the CLI', () => {
  const cli = read('bin/cli.mjs')
  assert.ok(!cli.toLowerCase().includes('migrate'), 'bin/cli.mjs references migrate — ADR-005 removed it from the CLI surface')
  assert.ok(!existsSync(join(PKG, 'bin/commands/migrate.mjs')), 'bin/commands/migrate.mjs exists — ADR-005 deleted it')
})

test('ADR-011: node:test only — no test-runner dependency', () => {
  const pkg = JSON.parse(read('package.json'))
  const deps = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) })
  const runners = deps.filter((d) => /jest|vitest|mocha|\bava\b/.test(d))
  assert.deepEqual(runners, [], `test-runner dependency found (${runners.join(', ')}) — ADR-011 mandates node:test`)
  assert.match(pkg.scripts.test, /node --test/, 'npm test must invoke node --test (ADR-011)')
})

// ─── ADR-017: ADR index — every decision binds to a real guard ────────────────
// The index table in system-decisions.md is the enforcement contract: every
// Accepted ADR names a guard whose backticked tokens literally appear in test
// sources, or explicitly declares "none — <why>". This meta-guard turns "ADR
// promises a test that never gets built" (the ADR-014 failure mode) into a CI
// failure instead of a future audit finding.

const DECISIONS = readFileSync(join(PKG, 'lib/wiki/system-decisions.md'), 'utf8')
const ADR_ROWS = [...DECISIONS.matchAll(/^\| (ADR-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (.+) \|$/gm)]
  .map(([, id, title, scope, status, guard]) => ({
    id, title: title.trim(), scope: scope.trim(), status: status.trim(), guard: guard.trim(),
  }))

test('ADR-017: index table and ADR headings cover the same set', () => {
  const headings = [...DECISIONS.matchAll(/^## (ADR-\d{3}) /gm)].map((m) => m[1])
  assert.deepEqual(
    [...new Set(ADR_ROWS.map((r) => r.id))].sort(),
    [...new Set(headings)].sort(),
    'every ## ADR-NNN heading needs an index row, and every index row a heading'
  )
  assert.ok(ADR_ROWS.length > 0, 'no ADR index rows parsed — table format changed?')
})

test('ADR-017: every index row has a valid Scope and Status', () => {
  const SCOPES = new Set(['methodology', 'package-internal', 'tool:claude', 'tool:cursor'])
  for (const r of ADR_ROWS) {
    assert.ok(SCOPES.has(r.scope), `${r.id}: invalid Scope "${r.scope}" — allowed: ${[...SCOPES].join(', ')}`)
    assert.ok(
      /^(Accepted|Superseded by ADR-\d{3})/.test(r.status),
      `${r.id}: invalid Status "${r.status}" — must be Accepted or Superseded by ADR-NNN`
    )
  }
})

test('ADR-017: every Accepted ADR has a guard resolvable in test sources (or explicit none)', () => {
  const sources = [
    ['test/unit', '.mjs'],
    ['test/integration', '.sh'],
    ['test/hooks', '.sh'],
  ].flatMap(([dir, ext]) =>
    readdirSync(join(PKG, dir))
      .filter((f) => f.endsWith(ext))
      .map((f) => readFileSync(join(PKG, dir, f), 'utf8'))
  ).join('\n')

  for (const r of ADR_ROWS) {
    if (!r.status.startsWith('Accepted')) continue
    assert.ok(r.guard && r.guard !== '—', `${r.id}: Accepted but Guard cell is empty`)
    if (r.guard.startsWith('none')) {
      assert.match(r.guard, /^none — .+/, `${r.id}: bare "none" — state why no guard is needed`)
      continue
    }
    const tokens = [...r.guard.matchAll(/`([^`]+)`/g)].map((t) => t[1])
    assert.ok(tokens.length > 0, `${r.id}: Guard "${r.guard}" has no backticked tokens — name the mechanism or use "none — <why>"`)
    for (const tok of tokens) {
      assert.ok(
        sources.includes(tok),
        `${r.id}: guard token \`${tok}\` not found in any test source — the named guard does not exist (ADR-014 failure mode)`
      )
    }
  }
})
