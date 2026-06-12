/**
 * mcp-reader.test.mjs — fixture-driven behavioral tests for the MCP read layer
 * (G13). Until now this surface had only static string checks; these parse the
 * clean-populated consumer and assert real field mappings — the kind of bug
 * they exist for: the roadmap fixture had Name/Status silently swapped, and
 * positional parsing returned a status as the POC's name.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { readFrontmatter, queryByFrontmatter, readDecisionsTracker, readPocRoadmap, bodyExcerpt } from '../../bin/lib/mcp-reader.mjs'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const CLEAN = join(PKG_ROOT, 'test', 'fixtures', 'clean-populated')
const CONCLUSIONS = join(CLEAN, 'conclusions', 'phase-01-poc-01-conclusions.md')

test('G13: readFrontmatter uses the canon dialect (scalars, lists, consolidation with md-rules)', () => {
  const fm = readFrontmatter(CONCLUSIONS)
  assert.equal(fm.type, 'poc-conclusions')
  assert.equal(fm.phase, '01')
  assert.equal(fm.status, 'complete')
  assert.equal(fm.alignment_verified, '2026-06-02')
  assert.deepEqual(fm.key_facts, [], 'list fields must parse as arrays (the old mini-YAML dropped them)')
})

test('G13: readFrontmatter returns {} for missing files and frontmatter-less docs', () => {
  assert.deepEqual(readFrontmatter(join(CLEAN, 'no-such-file.md')), {})
  assert.deepEqual(readFrontmatter(join(CLEAN, 'wiki', 'project', 'decisions.md')), {})
})

test('G13: queryByFrontmatter filters by field values', () => {
  const hits = queryByFrontmatter(join(CLEAN, 'conclusions'), { type: 'poc-conclusions' })
  assert.equal(hits.length, 1)
  assert.equal(hits[0].filename, 'phase-01-poc-01-conclusions.md')
  assert.equal(queryByFrontmatter(join(CLEAN, 'conclusions'), { type: 'no-such-type' }).length, 0)
})

test('G13: readDecisionsTracker maps the four §9 columns positionally', () => {
  const rows = readDecisionsTracker(join(CLEAN, 'plans', 'phase-01-index.md'))
  assert.ok(rows.length >= 1, 'expected tracker rows')
  const d01 = rows.find((r) => r.id === 'D-01')
  assert.ok(d01, `D-01 row missing: ${JSON.stringify(rows)}`)
  assert.equal(d01.description, 'Adopt Foo')
  assert.equal(d01.status, 'Closed')
  assert.match(d01.closed, /2026-06-01/)
})

test('G13: readPocRoadmap maps all six template columns incl. sessions + decisions', () => {
  const rows = readPocRoadmap(join(CLEAN, 'plans', 'phase-01-poc-roadmap.md'))
  assert.ok(rows.length >= 2, 'expected roadmap rows')
  const poc1 = rows.find((r) => r.poc === 'POC 01')
  assert.ok(poc1, `POC 01 row missing: ${JSON.stringify(rows)}`)
  assert.equal(poc1.name, 'Foo validation', 'Name column must be the name (the fixture once had Name/Status swapped)')
  assert.equal(poc1.status, '✅ Complete')
  assert.equal(poc1.sessions, 'S1')
  assert.equal(poc1.decisions, 'D-01')
})

test('G13: bodyExcerpt skips frontmatter and returns body lines', () => {
  const excerpt = bodyExcerpt(CONCLUSIONS)
  assert.match(excerpt, /^# POC 01 — Conclusions/, 'excerpt must start at the body, not the frontmatter')
  assert.ok(!excerpt.includes('alignment_verified'), 'frontmatter must not leak into the excerpt')
})
