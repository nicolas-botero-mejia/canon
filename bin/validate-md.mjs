#!/usr/bin/env node
// Thin CLI over the Node validation core (ADR-019), called by lib/scripts wrappers.
//   validate-md.mjs content-index <file>
//   validate-md.mjs index-registration <file> [relpath...]
//   validate-md.mjs link-targets <file>
//   validate-md.mjs alignment-agreement <file...>
// Output protocol (validating modes): issues one-per-line + exit 1; `OK <count>`
// + exit 0. link-targets is pure extraction: raw destinations one-per-line,
// always exit 0. Exit 2 = usage error. The bash wrapper owns ✓/⚠/✗ and tiers.
import { readFileSync } from 'fs'
import { basename } from 'path'
import { runContentIndexCheck, runIndexRegistrationCheck, extractLinkDestinations, runAlignmentAgreementCheck } from './lib/md-rules.mjs'

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
} else if (mode === 'link-targets' && file) {
  for (const dest of extractLinkDestinations(readFileSync(file, 'utf8'))) console.log(dest)
} else if (mode === 'alignment-agreement' && file) {
  const files = [file, ...rest]
  const issues = []
  for (const f of files) {
    const issue = runAlignmentAgreementCheck(readFileSync(f, 'utf8'))
    if (issue) issues.push(`${basename(f)}: ${issue}`)
  }
  if (issues.length > 0) {
    for (const issue of issues) console.log(issue)
    process.exit(1)
  }
  console.log(`OK ${files.length}`)
} else {
  console.error('usage: validate-md.mjs content-index <file> | index-registration <file> [relpath...] | link-targets <file> | alignment-agreement <file...>')
  process.exit(2)
}
