import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PKG_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const SKILLS_DIR = join(PKG_ROOT, 'lib', '.claude', 'skills')

const NEW_SKILLS = [
  'activity-deprecate',
  'activity-update',
  'activity-migrate',
  'phase-deprecate',
  'phase-reorder',
  'phase-update',
]

// Skills that write files must register in CONTENT_INDEX; skills that don't write files are exempt
const CONTENT_INDEX_EXEMPT = ['activity-update', 'phase-update']

for (const skill of NEW_SKILLS) {
  const skillPath = join(SKILLS_DIR, skill, 'SKILL.md')

  test(`${skill}: SKILL.md exists`, () => {
    assert.ok(existsSync(skillPath), `Expected ${skillPath} to exist`)
  })

  test(`${skill}: has ## When to use section`, () => {
    const content = readFileSync(skillPath, 'utf8')
    assert.ok(content.includes('## When to use'), `${skill}/SKILL.md missing "## When to use"`)
  })

  test(`${skill}: has fail-safe table`, () => {
    const content = readFileSync(skillPath, 'utf8')
    assert.ok(
      content.includes('| # | Condition | Severity | Response |'),
      `${skill}/SKILL.md missing fail-safe table header`
    )
  })

  test(`${skill}: has at least one Hard block`, () => {
    const content = readFileSync(skillPath, 'utf8')
    assert.ok(content.includes('**Hard block**'), `${skill}/SKILL.md has no **Hard block** entry`)
  })

  test(`${skill}: steps include log.md`, () => {
    const content = readFileSync(skillPath, 'utf8')
    assert.ok(content.includes('log.md'), `${skill}/SKILL.md steps do not reference log.md`)
  })

  if (!CONTENT_INDEX_EXEMPT.includes(skill)) {
    test(`${skill}: steps include CONTENT_INDEX`, () => {
      const content = readFileSync(skillPath, 'utf8')
      assert.ok(content.includes('CONTENT_INDEX'), `${skill}/SKILL.md steps do not reference CONTENT_INDEX`)
    })
  }
}
