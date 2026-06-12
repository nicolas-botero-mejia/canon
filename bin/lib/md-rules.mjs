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

// ── ADR-019 stage 2: index registration ──────────────────────────────────────

// Normalize a link destination to root-relative form: drop #fragment, strip a
// leading ./ or /, best-effort %XX decode. The index sits at the project root,
// so targets compare directly against root-relative file paths.
function normalizeTarget(raw) {
  let t = raw.trim().replace(/#.*$/, '').replace(/^\.?\//, '')
  try { t = decodeURIComponent(t) } catch { /* keep raw on malformed escapes */ }
  return t
}

// Collect every markdown link destination — inline resources and reference
// definitions — in document order, raw (`./`/`../` prefixes and fragments
// intact). Fence-awareness is structural: fenced and inline code yield no link
// tokens, a path in prose yields nothing, and a link title is a separate token
// so titled links yield the bare path (the python regex extractor in the old
// check-links grabbed the title too — ADR-019 stage 3).
export function extractLinkDestinations(content) {
  const destinations = []
  const collector = {
    names: ['canon-collect-link-targets'],
    description: 'internal: collect link destinations',
    tags: ['canon'],
    parser: 'micromark',
    function: (params) => {
      const walk = (tokens) => {
        for (const t of tokens) {
          if (t.type === 'resourceDestinationString' || t.type === 'definitionDestinationString') {
            destinations.push(t.text)
          }
          if (t.children) walk(t.children)
        }
      }
      walk(params.parsers.micromark.tokens)
    },
  }
  lint({
    strings: { f: content },
    customRules: [collector],
    config: { default: false, 'canon-collect-link-targets': true },
  })
  return destinations
}

// The same destinations as a normalized Set — the registration matcher's view
// (ADR-019 stage 2): "is this root-relative path a link target in the index?"
export function extractLinkTargets(content) {
  return new Set(extractLinkDestinations(content).map(normalizeTarget))
}

// Which of the given root-relative paths are not registered as link targets in
// the index document? Returns { missing: string[], checkedCount }.
export function runIndexRegistrationCheck(content, relpaths) {
  const targets = extractLinkTargets(content)
  return {
    missing: relpaths.filter((p) => !targets.has(p)),
    checkedCount: relpaths.length,
  }
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
