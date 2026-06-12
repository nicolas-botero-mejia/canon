/**
 * index-gen.test.mjs — ADR-021 CONTENT_INDEX project-layer generator.
 * Covers the frontmatter dialect, both entry forms (two-form contract), marker
 * splicing, the ADR-012 fallback for frontmatter-banned dirs, and a CLI e2e
 * proving the generated index satisfies check-index + check-contracts.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { parseFrontmatter } from '../../bin/lib/md-rules.mjs'
import { renderEntry, renderProjectLayer, applyProjectLayer, MARKER_BEGIN, MARKER_END, PROJECT_DIRS } from '../../bin/lib/index-gen.mjs'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLI = join(PKG_ROOT, 'bin', 'cli.mjs')

// ── frontmatter dialect ────────────────────────────────────────────────────────

test('ADR-021 dialect: scalars, quoted strings, lists, booleans, comments', () => {
  const fm = parseFrontmatter([
    '---',
    '# full-line comment ignored',
    'type: poc-results',
    'description: "Quoted: with a colon"',
    'key_facts:',
    '  - fact one',
    "  - 'fact two'",
    'questions: []',
    'noindex: true',
    '---',
    '# Body',
  ].join('\n'))
  assert.equal(fm.type, 'poc-results')
  assert.equal(fm.description, 'Quoted: with a colon')
  assert.deepEqual(fm.key_facts, ['fact one', 'fact two'])
  assert.deepEqual(fm.questions, [])
  assert.equal(fm.noindex, true)
})

test('ADR-021 dialect: no leading frontmatter → null', () => {
  assert.equal(parseFrontmatter('# Just a doc\n\n---\nnot frontmatter\n---\n'), null)
})

// ── entry forms (two-form contract) ───────────────────────────────────────────

const FULL = '---\ndescription: What this is.\nkey_facts:\n  - a fact\nquestions:\n  - a question?\n---\n# Doc\n'
const LIGHT = '---\ndescription: One liner.\nkey_facts: []\nquestions: []\n---\n# Doc\n'
const PARTIAL = '---\ndescription: Partial.\nquestions:\n  - q?\n---\n# Doc\n'

test('ADR-021 forms: all three fields → full four-part block', () => {
  const { entry } = renderEntry('findings/x.md', FULL)
  assert.match(entry, /^### \[x\.md\]\(\.\/findings\/x\.md\)/)
  assert.match(entry, /\*\*What it is:\*\* What this is\./)
  assert.match(entry, /\*\*Key facts:\*\*\n- a fact/)
  assert.match(entry, /\*\*Questions it answers:\*\*\n- a question\?/)
})

test('ADR-021 forms: description only → lightweight one-liner (0 markers)', () => {
  const { entry, warning } = renderEntry('findings/x.md', LIGHT)
  assert.equal(entry, '### [x.md](./findings/x.md)\nOne liner.')
  assert.equal(warning, null)
})

test('ADR-021 forms: partial fields → lightweight + warning (never 1–2/3 markers)', () => {
  const { entry, warning } = renderEntry('findings/x.md', PARTIAL)
  assert.ok(!entry.includes('**Questions it answers:**'), 'partial must not emit a broken block')
  assert.match(warning, /two-form contract/)
})

test('ADR-021 opt-outs: noindex, empty description, no frontmatter → no entry', () => {
  assert.equal(renderEntry('findings/x.md', '---\ndescription: Yes.\nnoindex: true\n---\n').entry, null)
  assert.equal(renderEntry('findings/x.md', '---\ndescription: ""\n---\n').entry, null)
  assert.equal(renderEntry('findings/x.md', '# No frontmatter\n').entry, null)
})

test('ADR-021 / ADR-012: wiki/client + wiki/user fall back to H1 title', () => {
  const { entry } = renderEntry('wiki/client/org.md', '# Acme Corp Structure\n\nProse.\n')
  assert.match(entry, /^### \[org\.md\]\(\.\/wiki\/client\/org\.md\)/)
  assert.match(entry, /Acme Corp Structure — served whole via MCP/)
})

// ── marker splicing ───────────────────────────────────────────────────────────

test('ADR-021 markers: replaces between markers, leaves outside content alone', () => {
  const index = `# Index\n\nHand-written entry stays.\n\n${MARKER_BEGIN}\n\nOLD GENERATED\n\n${MARKER_END}\n\nTrailing hand content.\n`
  const out = applyProjectLayer(index, `${MARKER_BEGIN}\n\nNEW\n\n${MARKER_END}`)
  assert.ok(out.includes('Hand-written entry stays.'))
  assert.ok(out.includes('Trailing hand content.'))
  assert.ok(out.includes('NEW'))
  assert.ok(!out.includes('OLD GENERATED'))
})

test('ADR-021 markers: appends the marked section when a legacy index has none', () => {
  const out = applyProjectLayer('# Legacy Index\n\nHand entries only.\n', `${MARKER_BEGIN}\n\nNEW\n\n${MARKER_END}`)
  assert.ok(out.includes('Hand entries only.'))
  assert.ok(out.indexOf(MARKER_BEGIN) > out.indexOf('Hand entries only.'))
})

// ── generator over a staged tree + CLI e2e ────────────────────────────────────

// A findings doc that satisfies check-contracts' header rule (Author/Date in
// the first 10 lines) *and* carries the projection frontmatter.
const FULL_DOC = [
  '---',
  'description: What this is.',
  'key_facts:',
  '  - a fact',
  'questions:',
  '  - a question?',
  '---',
  '# Doc',
  '**Author:** AI',
  '**Date:** 2026-06-12',
  '**Status:** Complete',
  '',
].join('\n')

function stageProject() {
  const dir = mkdtempSync(join(tmpdir(), 'canon-index-gen-'))
  mkdirSync(join(dir, 'findings', '_archive'), { recursive: true })
  mkdirSync(join(dir, 'wiki', 'client'), { recursive: true })
  writeFileSync(join(dir, 'findings', 'phase-01-poc-01-results.md'), FULL_DOC)
  writeFileSync(join(dir, 'findings', '_archive', 'old.md'), FULL_DOC)
  writeFileSync(join(dir, 'wiki', 'client', 'org.md'), '# Acme Org\n')
  writeFileSync(join(dir, 'wiki', 'client', 'README.md'), '# readme — never indexed\n')
  writeFileSync(join(dir, 'CONTENT_INDEX.md'), `# Index\n\n${MARKER_BEGIN}\n\nstale\n\n${MARKER_END}\n`)
  return dir
}

test('ADR-021 generator: walks PROJECT_DIRS, skips README/_archive, groups by dir', () => {
  const dir = stageProject()
  const { section, count } = renderProjectLayer(dir)
  assert.equal(count, 2, section)
  assert.match(section, /## findings\//)
  assert.match(section, /## wiki\//)
  assert.ok(!section.includes('README'), 'README must not be indexed')
  assert.ok(!section.includes('_archive'), '_archive must not be indexed')
})

test('ADR-021 CLI e2e: canon index regenerates; output passes check-index and check-contracts; idempotent', () => {
  const dir = stageProject()
  execFileSync(process.execPath, [CLI, 'index'], { cwd: dir, encoding: 'utf8' })
  const once = readFileSync(join(dir, 'CONTENT_INDEX.md'), 'utf8')
  assert.ok(!once.includes('stale'), 'stale generated content must be replaced')
  assert.ok(once.includes('phase-01-poc-01-results.md'))

  // The generated index satisfies the registration check (ADR-019 target matching)
  const idx = spawnSync('bash', [join(PKG_ROOT, 'lib', 'scripts', 'check-index.sh')], { cwd: dir, encoding: 'utf8' })
  assert.equal(idx.status, 0, `generated index must register every file:\n${idx.stdout}`)

  // ...and the per-entry two-form contract (the generator's output contract)
  const contracts = spawnSync('bash', [join(PKG_ROOT, 'lib', 'scripts', 'check-contracts.sh')], { cwd: dir, encoding: 'utf8' })
  assert.equal(contracts.status, 0, `generated entries must satisfy check-contracts:\n${contracts.stdout}${contracts.stderr}`)

  // Idempotent: a second run is byte-identical
  execFileSync(process.execPath, [CLI, 'index'], { cwd: dir, encoding: 'utf8' })
  assert.equal(readFileSync(join(dir, 'CONTENT_INDEX.md'), 'utf8'), once)
})

test('ADR-021: PROJECT_DIRS is the check-index DIRS list (single registration scope)', () => {
  const sh = readFileSync(join(PKG_ROOT, 'lib', 'scripts', 'check-index.sh'), 'utf8')
  const m = sh.match(/DIRS=\(([^)]+)\)/)
  const shDirs = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
  assert.deepEqual([...PROJECT_DIRS].sort(), [...shDirs].sort())
})

// ─── #32: every monitored-dir template projects into the index ────────────────
// Binding: parse template-index.md's destination column; every template whose
// output lands in a monitored dir must carry parseable frontmatter with the
// projection fields — and a file created from it (description filled) must
// produce a registered entry. Catches future templates added without the fields.

function monitoredTemplates() {
  const indexMd = readFileSync(join(PKG_ROOT, 'lib', 'templates', 'template-index.md'), 'utf8')
  const rows = [...indexMd.matchAll(/^\| `([^`]+\.md)` \| ([^|]+) \|/gm)]
  return rows
    .map(([, name, dest]) => ({ name, dest: dest.trim() }))
    .filter(({ dest }) => !dest.includes('§')) // section template — appended, never standalone
    .filter(({ dest }) => PROJECT_DIRS.some((d) => dest.startsWith(`\`${d}/`) || dest.startsWith(d + '/')))
}

test('#32: every monitored-dir template carries the projection frontmatter', () => {
  const templates = monitoredTemplates()
  assert.ok(templates.length >= 20, `template-index parse looks broken: found ${templates.length}`)
  for (const { name } of templates) {
    const fm = parseFrontmatter(readFileSync(join(PKG_ROOT, 'lib', 'templates', name), 'utf8'))
    assert.ok(fm, `${name}: no parseable frontmatter block`)
    for (const field of ['description', 'key_facts', 'questions']) {
      assert.ok(field in fm, `${name}: missing projection field ${field}`)
    }
    assert.ok('type' in fm, `${name}: missing type field`)
  }
})

test('#32: a file created from each monitored template projects into the index', () => {
  const dir = mkdtempSync(join(tmpdir(), 'canon-tpl-proj-'))
  const staged = []
  monitoredTemplates().forEach(({ name, dest }, i) => {
    const destDir = dest.replace(/`/g, '').split('/')[0]
    const content = readFileSync(join(PKG_ROOT, 'lib', 'templates', name), 'utf8')
      .replace('description: ""', `description: From template ${name}.`)
    mkdirSync(join(dir, destDir), { recursive: true })
    const relPath = `${destDir}/template-probe-${i}.md`
    writeFileSync(join(dir, relPath), content)
    staged.push(relPath)
  })
  const { section } = renderProjectLayer(dir)
  for (const relPath of staged) {
    assert.ok(section.includes(`(./${relPath})`), `${relPath} did not project into the index`)
  }
})
