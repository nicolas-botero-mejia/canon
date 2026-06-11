#!/usr/bin/env node
// Thin CLI over the Node validation core (ADR-019), called by lib/scripts wrappers.
//   validate-md.mjs content-index <file>
// Output protocol: issues one-per-line + exit 1; `OK <entryCount>` + exit 0.
// Exit 2 = usage error. The bash wrapper owns ✓/✗ formatting and tiers.
import { readFileSync } from 'fs'
import { runContentIndexCheck } from './lib/md-rules.mjs'

const [mode, file] = process.argv.slice(2)
if (mode !== 'content-index' || !file) {
  console.error('usage: validate-md.mjs content-index <file>')
  process.exit(2)
}

const { issues, entryCount } = runContentIndexCheck(readFileSync(file, 'utf8'))
if (issues.length > 0) {
  for (const issue of issues) console.log(issue)
  process.exit(1)
}
console.log(`OK ${entryCount}`)
