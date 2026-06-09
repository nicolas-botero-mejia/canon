/**
 * scanners.test.mjs — Whole-repo invariant scanners (completeness by construction)
 *
 * Unlike invariants.test.mjs (which checks a hand-listed set of locations per
 * concept), these tests scan EVERY source file. A registry test can only catch
 * drift in locations someone remembered to list; a scanner cannot miss a
 * location, because it visits all of them.
 *
 * Two families:
 *   1. FORBIDDEN-VALUE SCAN (denylist) — dead values that must appear nowhere
 *      except an explicit allowlist (the registry row / ADR that *defines* them).
 *   2. SELF-ENUMERATING COVERAGE — globs the skills/templates dirs and asserts
 *      each member satisfies its rule. Adding skill #15 or template #N is covered
 *      automatically: there is nothing to remember to add here.
 *
 * See lib/wiki/system-invariants.md §"Whole-repo scanners" for the model.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { CONTENT_CHECKS } from '../../bin/commands/doctor.mjs'

const PKG = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')

// ─── File collection ─────────────────────────────────────────────────────────

const SCAN_DIRS = ['lib', 'bin', 'docs', 'examples']
const SCAN_ROOT_FILES = ['manifest.json']
const SCAN_EXT = new Set(['.md', '.mdc', '.mjs', '.sh', '.json', '.toml'])
const EXCLUDE_SEGMENTS = new Set(['node_modules', '.git', 'archive', 'deprecated', 'tmp'])

function walk(dir, acc) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of entries) {
    if (EXCLUDE_SEGMENTS.has(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, acc)
    else if (SCAN_EXT.has(extname(e.name))) acc.push(full)
  }
  return acc
}

function collectFiles() {
  const files = []
  for (const d of SCAN_DIRS) walk(join(PKG, d), files)
  for (const f of SCAN_ROOT_FILES) {
    const p = join(PKG, f)
    if (existsSync(p)) files.push(p)
  }
  return files.map((f) => ({ rel: relative(PKG, f), text: readFileSync(f, 'utf8') }))
}

const FILES = collectFiles()

// ─── 1. Forbidden-value scan ─────────────────────────────────────────────────
// `allow` lists files where the value legitimately appears because the file
// *defines* it as forbidden (the registry row, the ADR, a deletable legacy plan).

const FORBIDDEN = [
  {
    id: 'phase-conclude SKILL.md: no hardcoded phase/POC numbers (must be generic)',
    // Skills must work for any phase number, not just phase 01→02.
    // Only checked in skill files — usage examples in scripts/docs are fine.
    match: (line, rel) => {
      if (!rel.startsWith('lib/.claude/skills/')) return false
      return (
        /phase-transition\.sh 0[0-9] 0[0-9]/.test(line) ||
        /plans\/_archive\/phase-0[0-9]/.test(line) ||
        /conclusions\/phase-0[0-9]-summary/.test(line) ||
        /\(POC 0[0-9], 0[0-9]\)/.test(line) ||
        /Phase [0-9]+ → Phase [0-9]+/.test(line)
      )
    },
    allow: [],
  },
  {
    id: 'R-013 dead phase-synthesis name "synthesis-conclusions"',
    match: (line) => line.includes('synthesis-conclusions'),
    allow: ['lib/wiki/system-invariants.md'],
  },
  {
    id: 'R-013 dead phase-synthesis name "phase-NN-conclusions.md"',
    match: (line) => /phase-(NN|\{\{PHASE_NUMBER\}\})-conclusions\.md/.test(line),
    allow: ['lib/wiki/system-invariants.md'],
  },
  {
    id: 'R-012 dead path "wiki/meta/"',
    match: (line) => line.includes('wiki/meta/'),
    allow: [
      'lib/wiki/system-invariants.md',
      'lib/wiki/system-decisions.md',
      'docs/plan-v0.1.4.md',
      'docs/plan-v0.2.0.md',
    ],
  },
  {
    id: 'PROJECT_ROOT dead root-resolution `dirname "$0")/../..`',
    match: (line) => line.includes('dirname "$0")/../..'),
    allow: ['lib/wiki/system-invariants.md'],
  },
  {
    id: 'R-011 dead Stop-blocking claim "blocks on exit 2"',
    match: (line) => line.includes('blocks on exit 2'),
    allow: ['lib/wiki/system-invariants.md'],
  },
]

for (const rule of FORBIDDEN) {
  test(`forbidden-scan: ${rule.id} appears nowhere outside its allowlist`, () => {
    const hits = []
    for (const { rel, text } of FILES) {
      if (rule.allow.includes(rel)) continue
      text.split('\n').forEach((line, i) => {
        if (rule.match(line, rel)) hits.push(`  ${rel}:${i + 1}: ${line.trim()}`)
      })
    }
    assert.equal(hits.length, 0, `Forbidden value still present:\n${hits.join('\n')}`)
  })
}

// ─── 2. Scoped scan: addendum templates use the right conclude command ────────

test('forbidden-scan: addendum templates use /activity-conclude addendum (not poc)', () => {
  const hits = []
  for (const { rel, text } of FILES) {
    if (!/templates\/addendum\..*-template\.md$/.test(rel)) continue
    text.split('\n').forEach((line, i) => {
      if (line.includes('/activity-conclude poc')) hits.push(`  ${rel}:${i + 1}: ${line.trim()}`)
    })
  }
  assert.equal(hits.length, 0, `Addendum template references the wrong conclude command:\n${hits.join('\n')}`)
})

// ─── 3. Self-enumerating skill coverage ──────────────────────────────────────
// Globs every skill dir — a new skill is covered automatically.

const SKILLS_DIR = join(PKG, 'lib', '.claude', 'skills')
const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

// Skills that don't write files and therefore don't need CONTENT_INDEX registration steps.
// A skill belongs here only if it produces NO new files (e.g. wiki-manage just proposes changes;
// activity-update edits an existing file; phase-update edits an existing file).
const CONTENT_INDEX_EXEMPT = new Set([
  'activity-update',   // edits existing plan, no new file
  'phase-update',      // edits existing phase index, no new file
  'wiki-manage',       // proposes changes to existing wiki files; Librarian executes
  'conclusions-review', // reads and annotates existing files, no new standalone file
  'knowledge-audit',   // produces a tmp/ report — intentionally not indexed (transient)
])

for (const skill of skillDirs) {
  const skillPath = join(SKILLS_DIR, skill, 'SKILL.md')

  test(`skill-coverage: ${skill}/SKILL.md name field matches directory`, () => {
    assert.ok(existsSync(skillPath), `${skill}/SKILL.md is missing`)
    const text = readFileSync(skillPath, 'utf8')
    const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim()
    assert.equal(name, skill, `SKILL.md "name: ${name}" must equal directory "${skill}" (agentskills.io spec)`)
  })

  test(`skill-coverage: ${skill}/SKILL.md has a substantive description`, () => {
    const text = readFileSync(skillPath, 'utf8')
    const desc = text.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ''
    assert.ok(
      desc.length >= 20,
      `${skill}/SKILL.md description too thin for auto-discovery (Copilot/Codex select by it): "${desc}"`
    )
  })

  if (!CONTENT_INDEX_EXEMPT.has(skill)) {
    test(`skill-coverage: ${skill}/SKILL.md instructs adding to CONTENT_INDEX`, () => {
      const text = readFileSync(skillPath, 'utf8')
      assert.ok(
        text.includes('CONTENT_INDEX'),
        `${skill}/SKILL.md creates files but never mentions CONTENT_INDEX — new files must be registered (Rule 6 + check-index.sh)`
      )
    })
  }
}

// ─── 4. Self-enumerating template coverage ───────────────────────────────────
// Globs every *-template.md — a new template not registered in the index fails.

const TEMPLATES_DIR = join(PKG, 'lib', 'templates')
const INDEX_TEXT = readFileSync(join(TEMPLATES_DIR, 'template-index.md'), 'utf8')
const templateFiles = readdirSync(TEMPLATES_DIR).filter(
  (f) => f.endsWith('-template.md') && f !== 'template-index.md'
)

for (const tpl of templateFiles) {
  test(`template-coverage: ${tpl} is registered in template-index.md`, () => {
    assert.ok(
      INDEX_TEXT.includes(tpl),
      `${tpl} exists in lib/templates/ but is not listed in template-index.md (Rule 9)`
    )
  })
}

// ─── 5. Content-check roster completeness (G6) ────────────────────────────────
// Every lib/scripts/check-*.sh must be wired into BOTH the doctor --deep roster
// (CONTENT_CHECKS in doctor.mjs) AND the Stop-hook chain (bin/hook.sh). A check
// shipped into neither would silently never run — the roster is hand-maintained in
// two places, so this binds them. Add to ROSTER_EXEMPT only with an explicit reason.

const ROSTER_EXEMPT = new Set([
  // (empty) — every check-*.sh today is a doctor + Stop content check.
])

const CHECK_SCRIPTS = readdirSync(join(PKG, 'lib', 'scripts'))
  .filter((f) => /^check-.*\.sh$/.test(f))
  .map((f) => f.replace(/\.sh$/, ''))
  .filter((s) => !ROSTER_EXEMPT.has(s))

const rosterScripts = CONTENT_CHECKS.map((c) => c[0])

// Parse the Stop chain from bin/hook.sh: `for chk in check-index ... check-contracts; do`
const hookSrc = readFileSync(join(PKG, 'bin', 'hook.sh'), 'utf8')
const hookChain = (hookSrc.match(/for chk in ([^;]+); do/)?.[1] ?? '').trim().split(/\s+/).filter(Boolean)

test('roster: every lib/scripts/check-*.sh is in doctor.mjs CONTENT_CHECKS', () => {
  for (const s of CHECK_SCRIPTS) {
    assert.ok(rosterScripts.includes(s), `${s}.sh exists but is missing from doctor.mjs CONTENT_CHECKS — it would never run in \`canon doctor --deep\``)
  }
})

test('roster: every lib/scripts/check-*.sh is in the bin/hook.sh Stop chain', () => {
  for (const s of CHECK_SCRIPTS) {
    assert.ok(hookChain.includes(s), `${s}.sh exists but is missing from bin/hook.sh's Stop chain — it would never run at session end`)
  }
})

test('roster: doctor CONTENT_CHECKS and the hook.sh Stop chain are the same set', () => {
  assert.deepEqual([...rosterScripts].sort(), [...hookChain].sort(),
    'doctor.mjs CONTENT_CHECKS and bin/hook.sh Stop chain must run the same content checks')
})

test('roster: every CONTENT_CHECKS entry maps to a real lib/scripts/*.sh', () => {
  for (const s of rosterScripts) {
    assert.ok(existsSync(join(PKG, 'lib', 'scripts', `${s}.sh`)), `CONTENT_CHECKS lists "${s}" but lib/scripts/${s}.sh does not exist`)
  }
})
