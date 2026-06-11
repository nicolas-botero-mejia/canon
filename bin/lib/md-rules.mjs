// Canon's markdown validation core (ADR-019). Custom markdownlint rules for the
// project's structural contracts, replacing per-script awk/grep lexing. Stage 1:
// the CONTENT_INDEX per-entry two-form check. Fence-awareness comes from micromark
// tokens — a `### heading` or `**marker:**` inside a fenced code block is not
// content, which the awk version could not see.
import { lint } from 'markdownlint/sync'

const MARKERS = [
  /^\*\*What it is:\*\*/,
  /^\*\*Key facts:\*\*/,
  /^\*\*Questions it answers:\*\*/,
]

export const contentIndexEntryRule = {
  names: ['canon-content-index-entry'],
  description:
    'CONTENT_INDEX entries are full four-part blocks (3/3 markers) or lightweight one-liners (0) — 1–2/3 is a broken block; file entries below ### are demoted',
  tags: ['canon'],
  parser: 'micromark',
  function: (params, onError) => {
    const fenced = new Set()
    for (const t of params.parsers.micromark.tokens) {
      if (t.type === 'codeFenced') {
        for (let l = t.startLine; l <= t.endLine; l++) fenced.add(l)
      }
    }

    let heading = null
    let headingLine = 0
    let level = 0
    let found = 0

    const closeBlock = () => {
      if (heading === null) return
      if (level >= 4 && heading.includes('.md')) {
        onError({
          lineNumber: headingLine,
          detail: `CONTENT_INDEX.md: entry demoted below ### level (all file entries must use ###): ${heading}`,
        })
        return
      }
      if (found >= 1 && found <= 2) {
        onError({
          lineNumber: headingLine,
          detail: `CONTENT_INDEX.md: entry is missing required parts (${found}/3 found — need all of What it is, Key facts, Questions it answers): ${heading}`,
        })
      }
    }

    params.lines.forEach((raw, i) => {
      if (fenced.has(i + 1)) return
      const m = raw.match(/^(#+)/)
      if (m) {
        closeBlock()
        heading = raw.slice(0, 80)
        headingLine = i + 1
        level = m[1].length
        found = 0
        return
      }
      if (MARKERS.some((re) => re.test(raw))) found++
    })
    closeBlock()
  },
}

// Line-based fence toggle — used only for the cosmetic entry count (validation
// above uses real parser tokens). Mirrors strip_code_blocks in check-stale-refs.sh.
function countEntriesOutsideFences(content) {
  let inFence = false
  let count = 0
  for (const line of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (!inFence && /^### /.test(line)) count++
  }
  return count
}

// Validate one CONTENT_INDEX document. Returns { issues: string[], entryCount }.
export function runContentIndexCheck(content) {
  const res = lint({
    strings: { f: content },
    customRules: [contentIndexEntryRule],
    config: { default: false, 'canon-content-index-entry': true },
  })
  const issues = (res.f ?? []).map((e) => e.errorDetail)
  return { issues, entryCount: countEntriesOutsideFences(content) }
}
