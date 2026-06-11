#!/usr/bin/env node
// Thin CLI over the Node validation core (ADR-019), called by lib/scripts wrappers.
//   validate-md.mjs content-index <file>
//   validate-md.mjs index-registration <file> [relpath...]
// Output protocol: issues one-per-line + exit 1; `OK <count>` + exit 0.
// Exit 2 = usage error. The bash wrapper owns ✓/⚠/✗ formatting and tiers.
import { readFileSync } from 'fs'
import { runContentIndexCheck, runIndexRegistrationCheck } from './lib/md-rules.mjs'

const [mode, file, ...rest] = process.argv.slice(2)

if (mode === 'content-index' && file) {
  const { issues, entryCount } = runContentIndexCheck(readFileSync(file, 'utf8'))
  if (issues.length > 0) {
    for (const issue of issues) console.log(issue)
    process.exit(1)
  }
  console.log(`OK ${entryCount}`)
} else if (mode === 'index-registration' && file) {
  const { missing, checkedCount } = runIndexRegistrationCheck(readFileSync(file, 'utf8'), rest)
  if (missing.length > 0) {
    for (const path of missing) console.log(path)
    process.exit(1)
  }
  console.log(`OK ${checkedCount}`)
} else {
  console.error('usage: validate-md.mjs content-index <file> | index-registration <file> [relpath...]')
  process.exit(2)
}
