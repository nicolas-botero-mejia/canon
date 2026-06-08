import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const SKILLS_DIR = join(PKG_ROOT, 'lib', '.claude', 'skills')
const TEMPLATES_DIR = join(PKG_ROOT, 'lib', 'templates')
const AGENTS_DIR = join(PKG_ROOT, 'lib', '.claude', 'agents')
const WIKI_DIR = join(PKG_ROOT, 'lib', 'wiki')

function read(path) { return readFileSync(path, 'utf8') }

// ── activity-conclude: new append model ──────────────────────────────────────

test('activity-conclude: does NOT reference standalone addendum conclusions path', () => {
  const content = read(join(SKILLS_DIR, 'activity-conclude', 'SKILL.md'))
  assert.ok(
    !content.includes('addendum-NN-conclusions.md') &&
    !content.match(/conclusions\/phase-NN-\[parent[^\]]*\]-addendum-NN/),
    'activity-conclude still references standalone addendum conclusions file path'
  )
})

test('activity-conclude: references ## Addendum NN append block', () => {
  const content = read(join(SKILLS_DIR, 'activity-conclude', 'SKILL.md'))
  assert.ok(content.includes('## Addendum NN'), 'activity-conclude missing ## Addendum NN')
})

test('activity-conclude: references **Addendum alignment verified:**', () => {
  const content = read(join(SKILLS_DIR, 'activity-conclude', 'SKILL.md'))
  assert.ok(
    content.includes('**Addendum alignment verified:**'),
    'activity-conclude missing **Addendum alignment verified:**'
  )
})

test('activity-conclude: Step 5 parent backlink removed (no standalone backlink step)', () => {
  const content = read(join(SKILLS_DIR, 'activity-conclude', 'SKILL.md'))
  // Old Step 5 pointed to a standalone conclusions file link — should be gone
  assert.ok(
    !content.includes('addendum-NN-[slug]-conclusions.md'),
    'activity-conclude still has old Step 5 standalone addendum conclusions backlink'
  )
})

// ── activity-new: no standalone stub ─────────────────────────────────────────

test('activity-new: does NOT reference addendum.conclusions-template.md for stub creation', () => {
  const content = read(join(SKILLS_DIR, 'activity-new', 'SKILL.md'))
  // The old behavior created a standalone stub from addendum.conclusions-template.md
  // The new behavior: addendum creates plan + results only
  assert.ok(
    !content.match(/addendum.*conclusions.*stub.*addendum\.conclusions-template/s),
    'activity-new still creates standalone addendum conclusions stub'
  )
})

// ── poc.conclusions-template.md: has ## Addendums placeholder ────────────────

test('poc.conclusions-template: has ## Addendums placeholder', () => {
  const content = read(join(TEMPLATES_DIR, 'poc.conclusions-template.md'))
  assert.ok(content.includes('## Addendums'), 'poc.conclusions-template.md missing ## Addendums section')
})

// ── No-standalone sweep ───────────────────────────────────────────────────────
// These files must NOT contain the old standalone addendum conclusions file path pattern

const SWEEP_FILES = [
  join(TEMPLATES_DIR, 'addendum.plan-template.md'),
  join(TEMPLATES_DIR, 'addendum.results-template.md'),
  join(TEMPLATES_DIR, 'addendum.notes-template.md'),
  join(AGENTS_DIR, 'librarian.md'),
]

// Old model: a line that CREATES or POINTS TO the standalone file (not one that says it should not exist)
// We check that lines containing the pattern do NOT imply creation/pointing to the file
function hasInstructionalStandaloneRef(content) {
  const lines = content.split('\n')
  for (const line of lines) {
    if (!/addendum-NN?[^`\n]*conclusions\.md/.test(line)) continue
    // Allow lines that say "should not exist", "flag", "old model", or are in backtick code spans
    // inside a "do not" / "no longer" / "old" / "flag" / "unexpected" context
    const lower = line.toLowerCase()
    if (lower.includes('should not exist') || lower.includes('old model') ||
        lower.includes('flag') || lower.includes('unexpected') ||
        lower.includes('no longer') || lower.includes('not create')) {
      continue
    }
    return true // instructional reference found
  }
  return false
}

for (const filePath of SWEEP_FILES) {
  const name = filePath.split('/').slice(-2).join('/')
  test(`no-standalone sweep: ${name} has no instructional standalone addendum conclusions path`, () => {
    const content = read(filePath)
    assert.ok(
      !hasInstructionalStandaloneRef(content),
      `${name} still contains instructional reference to standalone addendum conclusions file`
    )
  })
}

// ── No-backlink sweep ─────────────────────────────────────────────────────────
// These files must NOT contain "backlink" language in the old "parent gets a backlink" sense

const BACKLINK_SWEEP_FILES = [
  ...SWEEP_FILES,
  join(WIKI_DIR, 'system-operations.md'),
]

for (const filePath of BACKLINK_SWEEP_FILES) {
  const name = filePath.split('/').slice(-2).join('/')
  test(`no-backlink sweep: ${name} has no old backlink model language`, () => {
    const content = read(filePath)
    // The old model language: "backlink to this addendum" or "backlink section"
    const hasOldBacklink = content.includes('backlink to this addendum') ||
      content.includes('backlink section') ||
      content.includes('link back to it') ||
      content.includes('links back to the addendum')
    assert.ok(!hasOldBacklink, `${name} still contains old backlink model language`)
  })
}

// ── system-architecture.md: mirrors stay in sync ─────────────────────────────

test('system-architecture: template table uses renamed addendum.conclusions-section-template.md', () => {
  const content = read(join(WIKI_DIR, 'system-architecture.md'))
  assert.ok(
    !content.includes('| `addendum.conclusions-template.md`'),
    'system-architecture.md still lists old addendum.conclusions-template.md in template table'
  )
  assert.ok(
    content.includes('addendum.conclusions-section-template.md'),
    'system-architecture.md missing renamed addendum.conclusions-section-template.md'
  )
})

test('system-architecture: §9 roadmap status values match check-contracts.sh (not old v0.2.0 labels)', () => {
  const content = read(join(WIKI_DIR, 'system-architecture.md'))
  assert.ok(
    !content.includes('🔜 Next') && !content.includes('⏳ Planned') && !content.includes('🔄 In Progress'),
    'system-architecture.md §9 still has old v0.2.0 roadmap status labels'
  )
})

test('system-architecture: knowledge-audit dimension count is 15', () => {
  const content = read(join(WIKI_DIR, 'system-architecture.md'))
  assert.ok(
    !content.includes('14-dimension'),
    'system-architecture.md still says 14-dimension for /knowledge-audit'
  )
})

// ── librarian.md: addendum file-type list updated ─────────────────────────────

test('librarian.md: addendum file-type list does not include conclusions', () => {
  const content = read(join(AGENTS_DIR, 'librarian.md'))
  // Old: [plan|results|conclusions]  New: [plan|results]
  assert.ok(
    !content.includes('[plan|results|conclusions]'),
    'librarian.md still lists conclusions as a standalone addendum file type'
  )
})

test('librarian.md: references addendum-section integrity (not parent-backlink)', () => {
  const content = read(join(AGENTS_DIR, 'librarian.md'))
  assert.ok(
    content.includes('Addendum-section integrity') || content.includes('addendum-section integrity'),
    'librarian.md Dimension 7 still uses old parent-backlink name'
  )
})
