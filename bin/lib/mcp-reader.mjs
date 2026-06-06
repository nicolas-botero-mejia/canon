import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Parse YAML frontmatter from a file. Returns {} if none found.
export function readFrontmatter(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf8')
  if (!content.startsWith('---')) return {}
  const end = content.indexOf('\n---', 3)
  if (end === -1) return {}
  const yaml = content.slice(4, end).trim()
  return parseYaml(yaml)
}

// Minimal YAML parser for flat key: value pairs (no nesting, no complex types).
function parseYaml(yaml) {
  const result = {}
  for (const line of yaml.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '')
    if (key && val) result[key] = val
    else if (key) result[key] = ''
  }
  return result
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
// Returns [{poc, status, prerequisite, description}]
export function readPocRoadmap(roadmapPath) {
  if (!existsSync(roadmapPath)) return []
  const content = readFileSync(roadmapPath, 'utf8')
  const lines = content.split('\n')
  let headerParsed = false
  const rows = []

  for (const line of lines) {
    if (line.startsWith('| POC') || line.startsWith('| ---')) {
      headerParsed = !line.startsWith('| ---')
      continue
    }
    if (!headerParsed || !line.startsWith('|')) continue
    const cols = line.split('|').slice(1, -1).map(c => c.trim())
    if (cols.length >= 4) {
      rows.push({
        poc: cols[0],
        status: cols[1],
        prerequisite: cols[2],
        description: cols[3],
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
