import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { parseFrontmatter } from './md-rules.mjs'

// Parse frontmatter from a file. Returns {} if none found. Delegates to the
// canon-dialect parser in md-rules (G13 consolidation) — the old local
// mini-YAML diverged from it: it mis-keyed comment lines and dropped lists,
// so MCP could read frontmatter differently than the validation core.
export function readFrontmatter(filePath) {
  if (!existsSync(filePath)) return {}
  return parseFrontmatter(readFileSync(filePath, 'utf8')) ?? {}
}

// Return all files in dir matching filters (key-value pairs against frontmatter).
export function queryByFrontmatter(dir, filters = {}) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const filePath = join(dir, entry.name)
    const fm = readFrontmatter(filePath)
    let match = true
    for (const [k, v] of Object.entries(filters)) {
      if (fm[k] !== v) { match = false; break }
    }
    if (match) results.push({ filename: entry.name, ...fm })
  }
  return results
}

// Parse the §Decisions Tracker table from a phase index file.
// Returns [{id, description, status, closed}]
export function readDecisionsTracker(phaseIndexPath) {
  if (!existsSync(phaseIndexPath)) return []
  const content = readFileSync(phaseIndexPath, 'utf8')
  const lines = content.split('\n')
  let inTracker = false
  let headerParsed = false
  const rows = []

  for (const line of lines) {
    if (line.includes('## Decisions Tracker')) { inTracker = true; continue }
    if (inTracker && line.startsWith('## ') && !line.includes('Decisions Tracker')) break
    if (!inTracker) continue

    if (line.startsWith('| ID') || line.startsWith('| #')) { headerParsed = true; continue }
    if (line.startsWith('|---') || line.startsWith('| ---')) continue
    if (!headerParsed || !line.startsWith('|')) continue

    const cols = line.split('|').slice(1, -1).map(c => c.trim())
    if (cols.length >= 3) {
      rows.push({
        id: cols[0],
        description: cols[1],
        status: cols[2],
        closed: cols[3] ?? '',
      })
    }
  }
  return rows
}

// Parse POC roadmap table rows from a phase roadmap file.
// Template has 6 columns: POC # | Name | Status | Prerequisite | Sessions | Decisions it closes
// Returns [{poc, name, status, prerequisite, sessions, decisions}]
export function readPocRoadmap(roadmapPath) {
  if (!existsSync(roadmapPath)) return []
  const content = readFileSync(roadmapPath, 'utf8')
  const lines = content.split('\n')
  let headerParsed = false
  const rows = []

  for (const line of lines) {
    // Header is `| POC # | Name | …` — the '#' distinguishes it from data rows
    // like `| POC 01 | …`, which the old prefix match swallowed as headers
    // (and the unspaced separator row parsed as data). Caught by G13's tests.
    if (line.startsWith('| POC #')) { headerParsed = true; continue }
    if (/^\|\s*-/.test(line)) continue
    if (!headerParsed || !line.startsWith('|')) continue
    const cols = line.split('|').slice(1, -1).map(c => c.trim())
    if (cols.length >= 4) {
      rows.push({
        poc: cols[0],
        name: cols[1] ?? '',
        status: cols[2] ?? '',
        prerequisite: cols[3] ?? '',
        sessions: cols[4] ?? '',
        decisions: cols[5] ?? '',
      })
    }
  }
  return rows
}

// Return first 5 lines of body text (after frontmatter) as excerpt.
export function bodyExcerpt(filePath, lines = 5) {
  if (!existsSync(filePath)) return ''
  const content = readFileSync(filePath, 'utf8')
  let body = content
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end !== -1) body = content.slice(end + 4)
  }
  return body.split('\n').filter(l => l.trim()).slice(0, lines).join('\n')
}
