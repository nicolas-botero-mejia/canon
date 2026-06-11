/**
 * md-rules.test.mjs — direct tests for the Node validation core (ADR-019).
 * Bash-level behavior (wrapper dispatch, exit codes, ✓/✗ formatting) is covered
 * in content-scripts.test.mjs; these hit the rule logic without spawning a shell.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runContentIndexCheck, runIndexRegistrationCheck } from '../../bin/lib/md-rules.mjs'

const FULL_ENTRY = [
  '### [a.md](./wiki/a.md)',
  '**What it is:** x',
  '',
  '**Key facts:**',
  '- f',
  '',
  '**Questions it answers:**',
  '- q',
  '',
].join('\n')

test('md-rules: full four-part entry is valid', () => {
  const { issues, entryCount } = runContentIndexCheck(FULL_ENTRY)
  assert.deepEqual(issues, [])
  assert.equal(entryCount, 1)
})

test('md-rules: lightweight zero-marker entry is valid (two-form model)', () => {
  const { issues } = runContentIndexCheck('### [s](./.claude/skills/x/SKILL.md)\nOne-liner description.\n')
  assert.deepEqual(issues, [])
})

test('md-rules: grouping ### heading (no .md, no markers) is valid', () => {
  const { issues } = runContentIndexCheck('### Phase-level skills\n\nIntro text.\n')
  assert.deepEqual(issues, [])
})

test('md-rules: 1–2 of 3 markers = broken block', () => {
  const { issues } = runContentIndexCheck('### entry.md\n**What it is:** x\n')
  assert.equal(issues.length, 1)
  assert.match(issues[0], /missing required parts \(1\/3 found/)
  assert.match(issues[0], /### entry\.md/)
})

test('md-rules: #### file entry = demoted, regardless of markers', () => {
  const md = '#### deep.md\n**What it is:** x\n\n**Key facts:**\n- f\n\n**Questions it answers:**\n- q\n'
  const { issues } = runContentIndexCheck(md)
  assert.equal(issues.length, 1)
  assert.match(issues[0], /demoted below ### level/)
})

test('md-rules: fenced headings and markers are not entries (the awk bug class)', () => {
  const md = `${FULL_ENTRY}\nExample:\n\n\`\`\`\n### fake.md\n**What it is:** demo only\n\`\`\`\n`
  const { issues, entryCount } = runContentIndexCheck(md)
  assert.deepEqual(issues, [], 'fenced example must not be validated as an entry')
  assert.equal(entryCount, 1, 'fenced ### must not inflate the entry count')
})

// ── ADR-019 stage 2: index registration is target-exact and fence-aware ──────

test('md-rules: registration — prose mention sharing a line with an unrelated link is NOT registration (the line-grep bug class)', () => {
  const md = 'See findings/ghost.md and the [real](./findings/real.md) entry.\n'
  const { missing, checkedCount } = runIndexRegistrationCheck(md, ['findings/ghost.md', 'findings/real.md'])
  assert.deepEqual(missing, ['findings/ghost.md'], 'ghost is prose-only; real is a genuine target on the same line')
  assert.equal(checkedCount, 2)
})

test('md-rules: registration — a link inside fenced code is not a registration', () => {
  const md = 'Example:\n\n```\n- [x](findings/fenced.md)\n```\n'
  const { missing } = runIndexRegistrationCheck(md, ['findings/fenced.md'])
  assert.deepEqual(missing, ['findings/fenced.md'])
})

test('md-rules: registration — ./-prefix, #fragment, and reference definitions all register', () => {
  const md = [
    '- [a](./findings/a.md)',
    '- [b](findings/b.md#section)',
    '',
    '[ref]: conclusions/c.md',
    '',
  ].join('\n')
  const { missing } = runIndexRegistrationCheck(md, ['findings/a.md', 'findings/b.md', 'conclusions/c.md'])
  assert.deepEqual(missing, [])
})
