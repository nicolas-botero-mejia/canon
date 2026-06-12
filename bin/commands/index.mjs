import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { renderProjectLayer, applyProjectLayer } from '../lib/index-gen.mjs'

// `canon index` — regenerate the CONTENT_INDEX project layer from file
// frontmatter (ADR-021). Only the marker-delimited section is rewritten; the
// framework seed and hand-written entries outside the markers are untouched.
export async function run() {
  const consumerRoot = process.cwd()
  const idxPath = join(consumerRoot, 'CONTENT_INDEX.md')
  if (!existsSync(idxPath)) {
    console.error('canon index: no CONTENT_INDEX.md at project root. Run `canon init` first.')
    process.exit(1)
  }

  const { section, warnings, count } = renderProjectLayer(consumerRoot)
  const before = readFileSync(idxPath, 'utf8')
  const after = applyProjectLayer(before, section)
  if (after !== before) writeFileSync(idxPath, after)

  for (const w of warnings) console.log(`  ⚠ ${w}`)
  const noun = count === 1 ? 'entry' : 'entries'
  console.log(`✓ canon index: project layer ${after === before ? 'already current' : 'regenerated'} (${count} ${noun})`)
}
