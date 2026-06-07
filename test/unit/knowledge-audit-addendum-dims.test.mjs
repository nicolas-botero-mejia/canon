import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const SKILL_PATH = join(PKG_ROOT, 'lib', '.claude', 'skills', 'knowledge-audit', 'SKILL.md')

function read(path) { return readFileSync(path, 'utf8') }

test('knowledge-audit Dimension 10: does not reference standalone addendum filename', () => {
  const content = read(SKILL_PATH)
  // Extract the Dimension 10 section
  const dim10Start = content.indexOf('**Dimension 10')
  const dim11Start = content.indexOf('**Dimension 11')
  const dim10 = content.slice(dim10Start, dim11Start)
  assert.ok(
    !dim10.match(/addendum-NN-[^ ]*conclusions\.md/),
    'Dimension 10 still references standalone addendum filename pattern'
  )
})

test('knowledge-audit Dimension 10: references ## Addendum NN section check', () => {
  const content = read(SKILL_PATH)
  const dim10Start = content.indexOf('**Dimension 10')
  const dim11Start = content.indexOf('**Dimension 11')
  const dim10 = content.slice(dim10Start, dim11Start)
  assert.ok(
    dim10.includes('## Addendum NN'),
    'Dimension 10 does not reference ## Addendum NN section check'
  )
})

test('knowledge-audit Dimension 11: references **Addendum alignment verified:** field', () => {
  const content = read(SKILL_PATH)
  const dim11Start = content.indexOf('**Dimension 11')
  const dim12Start = content.indexOf('**Dimension 12')
  const dim11 = content.slice(dim11Start, dim12Start)
  assert.ok(
    dim11.includes('**Addendum alignment verified:**'),
    'Dimension 11 does not reference **Addendum alignment verified:** per-section check'
  )
})
