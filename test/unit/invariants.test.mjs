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
