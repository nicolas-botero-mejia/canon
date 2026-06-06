#!/usr/bin/env node
/**
 * Canon MCP server — read-only knowledge retrieval for consumer projects.
 * Start: npx canon-mcp (from consumer project root)
 * Resources: canon://wiki/..., canon://findings/..., etc.
 * Tools: query_decisions, query_findings, query_conclusions, get_project_state, surface_context
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { z } from 'zod'
import { readFrontmatter, queryByFrontmatter, readDecisionsTracker, readPocRoadmap, bodyExcerpt } from './lib/mcp-reader.mjs'

const CONSUMER_ROOT = process.cwd()
const server = new McpServer({
  name: 'canon',
  version: '0.2.0',
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeRead(filePath) {
  if (!existsSync(filePath)) return null
  return readFileSync(filePath, 'utf8')
}

function listMdFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => e.name)
}

// ── Resources ────────────────────────────────────────────────────────────────

// Wiki layers
for (const layer of ['project', 'client', 'user', 'standards']) {
  const dir = join(CONSUMER_ROOT, 'wiki', layer)
  for (const filename of listMdFiles(dir)) {
    server.resource(
      `canon://wiki/${layer}/${filename}`,
      `canon://wiki/${layer}/${filename}`,
      async () => ({
        contents: [{ uri: `canon://wiki/${layer}/${filename}`, text: safeRead(join(dir, filename)) ?? '' }],
      })
    )
  }
}

// findings/
for (const filename of listMdFiles(join(CONSUMER_ROOT, 'findings'))) {
  server.resource(
    `canon://findings/${filename}`,
    `canon://findings/${filename}`,
    async () => ({
      contents: [{ uri: `canon://findings/${filename}`, text: safeRead(join(CONSUMER_ROOT, 'findings', filename)) ?? '' }],
    })
  )
}

// conclusions/
for (const filename of listMdFiles(join(CONSUMER_ROOT, 'conclusions'))) {
  server.resource(
    `canon://conclusions/${filename}`,
    `canon://conclusions/${filename}`,
    async () => ({
      contents: [{ uri: `canon://conclusions/${filename}`, text: safeRead(join(CONSUMER_ROOT, 'conclusions', filename)) ?? '' }],
    })
  )
}

// deliverables/
for (const filename of listMdFiles(join(CONSUMER_ROOT, 'deliverables'))) {
  server.resource(
    `canon://deliverables/${filename}`,
    `canon://deliverables/${filename}`,
    async () => ({
      contents: [{ uri: `canon://deliverables/${filename}`, text: safeRead(join(CONSUMER_ROOT, 'deliverables', filename)) ?? '' }],
    })
  )
}

// plans/
for (const filename of listMdFiles(join(CONSUMER_ROOT, 'plans'))) {
  server.resource(
    `canon://plans/${filename}`,
    `canon://plans/${filename}`,
    async () => ({
      contents: [{ uri: `canon://plans/${filename}`, text: safeRead(join(CONSUMER_ROOT, 'plans', filename)) ?? '' }],
    })
  )
}

// CONTENT_INDEX.md
server.resource(
  'canon://CONTENT_INDEX.md',
  'canon://CONTENT_INDEX.md',
  async () => ({
    contents: [{ uri: 'canon://CONTENT_INDEX.md', text: safeRead(join(CONSUMER_ROOT, 'CONTENT_INDEX.md')) ?? '' }],
  })
)

// ── Tools ────────────────────────────────────────────────────────────────────

server.tool(
  'query_decisions',
  'Query open or closed decisions from a phase index file.',
  {
    phase: z.string().describe('Phase number (e.g. "01")'),
    status: z.string().optional().describe('Filter by status: "open", "closed", or "deferred"'),
  },
  async ({ phase, status }) => {
    const paddedPhase = phase.padStart(2, '0')
    const indexPath = join(CONSUMER_ROOT, 'plans', `phase-${paddedPhase}-index.md`)
    const rows = readDecisionsTracker(indexPath)
    const filtered = status
      ? rows.filter(r => r.status.toLowerCase().startsWith(status.toLowerCase()))
      : rows
    return {
      content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
    }
  }
)

server.tool(
  'query_findings',
  'List findings files filtered by frontmatter fields.',
  {
    phase: z.string().optional().describe('Phase number (e.g. "01")'),
    type: z.string().optional().describe('File type (e.g. "poc-results", "signal-results")'),
    topic: z.string().optional().describe('Topic slug'),
    discovery_type: z.string().optional().describe('For signals: "external" or "internal"'),
  },
  async ({ phase, type, topic, discovery_type }) => {
    const filters = {}
    if (phase) filters.phase = phase
    if (type) filters.type = type
    if (topic) filters.topic = topic
    if (discovery_type) filters.discovery_type = discovery_type
    const results = queryByFrontmatter(join(CONSUMER_ROOT, 'findings'), filters)
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }
)

server.tool(
  'query_conclusions',
  'List conclusions files filtered by frontmatter fields.',
  {
    phase: z.string().optional().describe('Phase number'),
    alignment_verified: z.string().optional().describe('Filter: "" for unverified, or a date string for verified'),
  },
  async ({ phase, alignment_verified }) => {
    const filters = {}
    if (phase) filters.phase = phase
    if (alignment_verified !== undefined) filters.alignment_verified = alignment_verified
    const results = queryByFrontmatter(join(CONSUMER_ROOT, 'conclusions'), filters)
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }
)

server.tool(
  'get_project_state',
  'Return a high-level summary of project state: active phase, open decisions, unverified conclusions, pending wiki confirmations.',
  {},
  async () => {
    // Determine active phase (highest phase-NN-index.md with status: active)
    const planFiles = listMdFiles(join(CONSUMER_ROOT, 'plans'))
    const indexFiles = planFiles
      .filter(f => /^phase-\d+-index\.md$/.test(f))
      .sort()
      .reverse()

    let activePhase = null
    let openDecisionsCount = 0
    let pocRoadmapSummary = []

    for (const f of indexFiles) {
      const fm = readFrontmatter(join(CONSUMER_ROOT, 'plans', f))
      if (!activePhase && (fm.status === 'active' || !fm.status)) {
        activePhase = fm.phase ?? f.match(/phase-(\d+)/)?.[1]
        const decisions = readDecisionsTracker(join(CONSUMER_ROOT, 'plans', f))
        openDecisionsCount = decisions.filter(d => d.status.toLowerCase().startsWith('open')).length

        // Try roadmap
        const roadmapFile = `phase-${activePhase}-poc-roadmap.md`
        if (existsSync(join(CONSUMER_ROOT, 'plans', roadmapFile))) {
          pocRoadmapSummary = readPocRoadmap(join(CONSUMER_ROOT, 'plans', roadmapFile))
            .map(r => ({ poc: r.poc, status: r.status }))
        }
        break
      }
    }

    // Unverified conclusions
    const unverifiedConclusions = queryByFrontmatter(join(CONSUMER_ROOT, 'conclusions'), { alignment_verified: '' })
    const unverifiedCount = unverifiedConclusions.length

    // Pending wiki confirmations (files with pending_confirmation frontmatter)
    const wikiDirs = ['project', 'client', 'user', 'standards']
    const pendingWiki = []
    for (const layer of wikiDirs) {
      const dir = join(CONSUMER_ROOT, 'wiki', layer)
      for (const f of listMdFiles(dir)) {
        const fm = readFrontmatter(join(dir, f))
        if (fm.pending_confirmation) pendingWiki.push(`wiki/${layer}/${f}`)
      }
    }

    const state = {
      active_phase: activePhase,
      open_decisions_count: openDecisionsCount,
      poc_roadmap_summary: pocRoadmapSummary,
      unverified_conclusions_count: unverifiedCount,
      pending_wiki_confirmations: pendingWiki,
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
    }
  }
)

server.tool(
  'surface_context',
  'Return relevant files for a topic, ordered by Librarian priority: conclusions > results > field-notes.',
  {
    topic: z.string().describe('Topic slug or keyword to search for'),
  },
  async ({ topic }) => {
    const slug = topic.toLowerCase().replace(/\s+/g, '-')
    const results = []

    // Conclusions first
    for (const f of listMdFiles(join(CONSUMER_ROOT, 'conclusions'))) {
      if (f.toLowerCase().includes(slug)) {
        const fm = readFrontmatter(join(CONSUMER_ROOT, 'conclusions', f))
        results.push({
          filename: `conclusions/${f}`,
          type: fm.type ?? 'conclusions',
          priority: 1,
          relevance_note: 'conclusions (highest priority)',
          excerpt: bodyExcerpt(join(CONSUMER_ROOT, 'conclusions', f)),
        })
      }
    }

    // Results / findings
    for (const f of listMdFiles(join(CONSUMER_ROOT, 'findings'))) {
      if (!f.toLowerCase().includes(slug)) continue
      const fm = readFrontmatter(join(CONSUMER_ROOT, 'findings', f))
      const isFieldNotes = fm.type === 'field-notes' || f.includes('field-notes')
      results.push({
        filename: `findings/${f}`,
        type: fm.type ?? 'findings',
        priority: isFieldNotes ? 3 : 2,
        relevance_note: isFieldNotes ? 'field-notes (supplementary)' : 'results (secondary)',
        excerpt: bodyExcerpt(join(CONSUMER_ROOT, 'findings', f)),
      })
    }

    results.sort((a, b) => a.priority - b.priority)
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }
)

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
