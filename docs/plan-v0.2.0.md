# Canon v0.2.0 — Testing Layer + MCP Integration

**Builds on:** v0.1.4 (must be complete and stable)
**Some decisions are explicitly TBD pending v0.1.4 outcomes — marked below.**

---

## What this plan solves

| Problem | Root cause |
|---------|-----------|
| One integration test (`update-safety.sh`), no unit tests | Test layer was deferred to avoid premature lock-in |
| MCP queries require full file reads and natural language parsing | No structured metadata in files — slow at scale, imprecise |
| Claude Code is the only tool with MCP support in the framework | `system-tool-integration.md` exists but has no MCP content yet |
| Structural patterns in template-generated files are not guaranteed | No parsing contract — an MCP server can't rely on them |

---

## Decisions locked

| Question | Decision | Rationale |
|----------|----------|-----------|
| Test runner | Node.js built-in `node:test` | No new dependencies. Native ESM. No jest/vitest complexity for what is essentially CLI testing. |
| Test layers | Unit + integration + hook (bash) | Each tests a different system boundary. Unit: command logic. Integration: full init→sync→doctor cycle. Hook: bash dispatcher routing. |
| Frontmatter timing | Design query surface first, then add frontmatter | Structure should follow the queries that need it — not the other way around. Adding frontmatter speculatively creates maintenance cost with no benefit until MCP is built. |
| MCP scope | Read-only query server (no writes) | Writes go through the CLI and skills. MCP is knowledge retrieval only. |
| MCP server entry point | `npx canon mcp` (registered in `package.json` bin) | Consistent with the existing `canon init/sync/doctor` pattern. |
| Schema consistency audit | Happens before MCP, not after | Parseable structure must be guaranteed before an MCP server relies on it. |
| MCP opt-in | Asked during `canon init` | Not every project needs MCP. Opt-in writes the `mcpServers` block to `.claude/settings.json`. |

---

## TBD — resolved after v0.1.4

These were open pending v0.1.4 completion. All are now decided.

| Item | Decision |
|------|----------|
| Frontmatter schema for `wiki/client/` and `wiki/user/` | **No frontmatter.** These files are exposed as full-content MCP resources. No cross-file filtering queries target them — adding frontmatter creates maintenance cost with zero query benefit. |
| MCP query surface for signals | **Handled by findings frontmatter** (`type: signal-results`). Add `discovery_type: external \| internal` field (see C2) — enables `query_findings(type: "signal-results", discovery_type: "internal")` without reading every signal file. Internal signals (cross-POC patterns, mid-activity insights) are preferentially surfaced by `surface_context`. |
| MCP query for ⚡ wiki entries | **Confirmed format.** Inline marker: `⚡ *Source: [path] — pending formal conclusions. Clear when /conclusions-review confirms.*` + wiki file frontmatter `pending_confirmation: [{section, source}]`. C2 wiki ⚡ schema is correctly specified — no change needed. |
| `check-contracts.sh` scope | **Finalized.** Contracts: phase-index decisions tracker columns + status values, poc-roadmap status emoji set, CONTENT_INDEX entry four-part format, header fields on findings and `conclusions/` files. Scope includes `session.plan-template.md` and updated `signal.results-template.md` from v0.1.4. See B3. |
| Which test fixtures to create | **Resolvable now.** Template outputs are known from the final v0.1.4 template set. Fixtures are created during Track A execution. |

---

## Track A — Test infrastructure

### A1. Test runner setup

Add to `package.json`:

```json
"scripts": {
  "test":             "node --test test/unit/**/*.test.mjs",
  "test:integration": "bash test/integration/run.sh",
  "test:hooks":       "bash test/hooks/run.sh",
  "test:all":         "npm test && npm run test:integration && npm run test:hooks"
}
```

Add `node:test` and `node:assert` — both built-in, no new `dependencies` or `devDependencies` needed.

Create `test/unit/`, `test/integration/`, `test/hooks/` directories. Move existing `test/update-safety.sh` → `test/integration/update-safety.sh`. Update any references.

> **Cleanup note:** `test/update-safety.sh` contains comment text using "payload" (e.g., `# Bump payload version`, `# revert payload marker`) — these are comment-only remnants from the v0.1.3 era, not path references. Clean them up when moving the file: replace "payload" in comments with "package" or "lib" as appropriate. No functional impact, but keeps the file consistent with the current naming.

### A2. Unit tests — bin/commands/

**`test/unit/init.test.mjs`**

Each test runs `init` against a temp directory and asserts file system state.

```
✅ Creates all USER_DIRS from init.mjs (including wiki/client, wiki/user, deliverables from v0.1.4)
✅ Creates .gitignore with canon entries (node_modules/, tmp/, .DS_Store, Thumbs.db)
✅ Creates .framework-version containing the correct version string
✅ Creates log.md and CONTENT_INDEX.md when absent
✅ Does not overwrite existing log.md or CONTENT_INDEX.md
✅ --force flag re-inits without error on an already-initialized project
✅ Missing --force on already-initialized project exits non-zero
✅ --yes skips prompts and defaults to Claude layer only
✅ Writes CLAUDE.md with correct @import line when Claude layer enabled
✅ Writes .claude/settings.json with correct hook commands when Claude layer enabled
✅ Does not write .claude/ files when Claude layer not enabled (--yes skips cursor, defaults claude)
✅ Writes .cursor/hooks.json when Cursor layer enabled
```

**`test/unit/sync.test.mjs`**

```
✅ Vendors all manifest.vendored dirs to consumer
✅ Skips user-modified files (warns to stderr) — no --force
✅ --force overwrites user-modified files without warning
✅ findModified returns [] when dest bytes match the stored manifest baseline
✅ findModified returns modified path when dest bytes differ from stored baseline
✅ findModified falls back to comparing against src when no manifest entry exists
✅ findModified handles nested dirs correctly (recurses)
✅ Updates .framework-version to current version
✅ Does not touch USER_DIRS (wiki/, plans/, findings/, etc.)
```

**`test/unit/doctor.test.mjs`**

```
✅ Exits 0 and prints all ✓ on a correctly initialized consumer
✅ Exits non-zero when .framework-version is missing
✅ Exits non-zero when .framework-version contains wrong version
✅ Exits non-zero when @import line is missing from CLAUDE.md
✅ Exits non-zero when a vendored dir is missing
✅ Exits non-zero when hook dispatcher is missing from node_modules
✅ Output format: one line per check with ✓ or ✗ prefix
```

### A3. Hook dispatcher tests

**`test/hooks/hook-dispatcher.test.sh`**

```bash
# Each test calls hook.sh with an event name and asserts exit code + output pattern

✅ hook.sh SessionStart  → routes to session-start-report.sh (exit 0)
✅ hook.sh PostToolUse   → routes to post-write-check.sh (exit 0 with null stdin)
✅ hook.sh Stop          → runs check-index → check-links → check-stale-refs → check-conclusions-alignment
✅ hook.sh UnknownEvent  → exits non-zero with "unknown event" message
✅ hook.sh (no args)     → exits non-zero with usage message
✅ Missing script file   → exits non-zero with clear error (not a silent pass)
```

### A4. User-mod detection tests (in sync.test.mjs)

These are the most critical tests — they protect the update-safety contract.

```
✅ findModified: identical files → []
✅ findModified: one byte different → [relative path]
✅ findModified: nested dir, one file modified → ['subdir/file.md']
✅ findModified: dest file absent → not included (absent = unmodified, sync will create it)
✅ vendorDirs: unmodified files → synced silently; manifest updated with new hashes
✅ vendorDirs: modified file, no --force → skipped + stderr warning with count
✅ vendorDirs: modified file, --force → synced + no warning; manifest updated
✅ Warning format: "⚠  Skipping [dir] — N user-modified file(s):" + list of paths
✅ vendorDirs: framework version update (dest ≠ new src, but dest == manifest) → synced without warning
```

### A5. Expand test/integration/update-safety.sh

After v0.1.4, update the integration test to cover:

```
✅ wiki/client/ and wiki/user/ are created on init
✅ wiki/client/ and wiki/user/ are NOT overwritten by sync (user-owned)
✅ deliverables/ is created on init
✅ deliverables/ is NOT overwritten by sync (user-owned — same contract as wiki/client/)
✅ /signal skill is vendored to .claude/skills/signal/SKILL.md
✅ session.plan-template.md is accessible in node_modules at the correct path
✅ system-tool-integration.md is accessible in node_modules
```

**Create `test/integration/run.sh`** — orchestrator that runs update-safety.sh and any other integration tests. Returns non-zero if any fail.

---

## Track B — Schema consistency audit

This track is a prerequisite for Track C (frontmatter) and Track D (MCP). An MCP server cannot reliably parse files with inconsistent structure.

### B1. Define parsing contracts

For each template-generated file type, document what is structurally guaranteed:

**`plans/phase-NN-index.md §Decisions Tracker`**
- Required columns: `ID` | `Description` | `Status` | `Closed / Deferred` (date + source)
- Status values: `Open` | `Closed — [answer] — [source], [date]` | `Deferred — [reason] — [trigger]`
- Contract: every row has all four columns; ID column is alphanumeric starting with `D-`

**`plans/phase-NN-poc-roadmap.md`**
- Required columns: `POC` | `Status` | `Prerequisite` | `Description`
- Status values: `🔜 Next` | `⏳ Planned` | `🔄 In Progress` | `✅ Complete` | `⏭️ Deferred`
- Contract: consistent emoji status values across all roadmap files

**`CONTENT_INDEX.md` entries**
- Required format: `### [filename](./path/to/file)`, `**What it is:** [one sentence]`, `**Key facts:**` list, `**Questions it answers:**` list
- Contract: every entry has all four parts; `**What it is:**` is always a single sentence

**`findings/*.results.md` and `conclusions/*.conclusions.md`**
- Required header fields: `**Author:**`, `**Date:**`, `**Status:**`
- Conclusions additionally: `**Alignment verified:**`
- Contract: these fields appear in the first 10 lines of every file

Document all contracts in a new `lib/wiki/system-architecture.md §9 — Parsing Contracts`.

### B2. Validate templates against contracts

Read each template file and verify it generates output that satisfies the contracts in B1. Update any template where the generated output would fail contract validation.

Specifically check: decisions tracker table column headers in `phase-index-template.md`, conclusions template header field order, CONTENT_INDEX entry format in templates that reference it.

### B3. Add check-contracts.sh

`lib/scripts/check-contracts.sh` — validates structural consistency at session close.

What it checks:
- `CONTENT_INDEX.md` entries follow the required four-part format
- Phase index `§Decisions Tracker` table has required columns
- Status values in POC roadmap are from the allowed set
- Every `findings/*.md` file has `**Author:**` and `**Date:**` in header

Add to the Stop hook chain in `bin/hook.sh` and the reference in `system-tool-integration.md §Claude Code`.

Update `examples/consumer/.claude/settings.json` — Stop hook command adds `check-contracts.sh` to the chain.

---

## Track C — Frontmatter design

**Wait for v0.1.4 to complete before executing this track.** The frontmatter schema depends on the final wiki layer structure and signal model.

### C1. Define MCP query surface

Before adding frontmatter to any file, answer: what questions should MCP be able to answer efficiently (without reading full file prose)?

Initial candidate queries — review and prune after v0.1.4:

| Query | What it needs |
|-------|--------------|
| Open decisions in phase NN | `type: decision`, `phase`, `status` fields |
| POC status by phase | `type: poc-results`, `phase`, `poc_id`, `status` |
| Findings on topic X | `type`, `phase`, `topic` tags |
| Conclusions pending alignment verification | `type: conclusions`, `alignment_verified` (empty vs date) |
| Wiki entries sourced from findings (⚡ marker) | `source_type: finding`, `source_file` |
| Signals by assessment type | `type: signal-results`, `assessment` field |
| Signals by discovery type | `type: signal-results`, `discovery_type: external \| internal` field |

**Rule:** if a query can be answered by reading one well-known file (e.g., the phase index), don't add frontmatter — just expose the file as an MCP resource. Only add frontmatter where you need to filter across many files.

### C2. Define minimal frontmatter schema

Only add frontmatter to file types where filtering queries require it. Prose body stays unchanged.

**`findings/*.md`** (results + signal + field-notes):
```yaml
---
type: poc-results | research-results | signal-results | session-results | field-notes | addendum-results | handoff
phase: "NN"
topic: "[slug]"
status: in-progress | complete
author: AI | Human | Mixed
date: YYYY-MM-DD
# for type: signal-results only
discovery_type: external | internal
---
```

**`conclusions/*.conclusions.md`**:
```yaml
---
type: poc-conclusions | research-conclusions | session-conclusions | addendum-conclusions
phase: "NN"
topic: "[slug]"
status: in-progress | complete
alignment_verified: "" | YYYY-MM-DD
---
```
*(Note: `conclusions/` is the correct path as of v0.1.4. Do not use `output/`.)*

**`plans/phase-NN-index.md`**:
```yaml
---
type: phase-index
phase: "NN"
status: active | concluded
---
```

Wiki files with ⚡ markers — frontmatter added only when promote is used, removed when marker clears:
```yaml
---
pending_confirmation:
  - section: "§N — Section Title"
    source: "findings/phase-NN-signal-NN-slug-results.md"
---
```

**Key constraints:**
- All date fields are strings (`"2026-06-06"`) not YAML date type — avoids timezone issues
- Frontmatter is the top of the file, before any `#` heading
- Fields use `snake_case`
- No required fields beyond `type` — others are optional but recommended

### C3. Update templates with frontmatter

Add YAML frontmatter header to the templates identified in C2. Template placeholders use the same `[bracket]` convention as the rest of the template body.

Update `system-template-standards.md` with a new section explaining the frontmatter convention: when it's used, the schema, and how to read it.

---

## Track D — MCP server

### D1. Server architecture

`bin/mcp-server.mjs` — registered in `package.json`:
```json
"bin": {
  "canon":     "bin/cli.mjs",
  "canon-mcp": "bin/mcp-server.mjs"
}
```

Uses `@modelcontextprotocol/sdk` (add to `dependencies`). The server is **stateless** — reads files on every query, no in-memory cache. Cache can be added in a later version once query patterns are understood.

`bin/lib/mcp-reader.mjs` — shared helpers:
- `readFrontmatter(filePath)` → parsed YAML object or `null`
- `queryByFrontmatter(dir, filters)` → files matching all filter key-value pairs
- `readDecisionsTracker(phaseIndexPath)` → parsed decisions table rows
- `readPocRoadmap(roadmapPath)` → parsed roadmap table rows

### D2. MCP resources

Resources expose raw file content — the AI reads the file and reasons about it.

```
wiki/{layer}/{filename}     → full file content (layer: project, client, user, standards)
findings/{filename}         → full file content
conclusions/{filename}      → full file content
deliverables/{filename}     → full file content
plans/{filename}            → full file content
CONTENT_INDEX.md            → full index file
```

Resource URIs: `canon://wiki/project/tech-stack.md`, `canon://findings/phase-01-poc-01-results.md`, `canon://conclusions/phase-01-poc-01-conclusions.md`, `canon://deliverables/report-v1.md`, etc.

`deliverables/` is user-owned (client-facing formal artifacts). No frontmatter needed — exposed as full-content resources. An AI writing next-phase conclusions or session plans needs to know what was already delivered to the client.

### D3. MCP tools

Tools answer structured queries — the AI calls these instead of reading files when it needs filtered lists.

```
query_decisions(phase, status?)
  → reads phase-NN-index.md frontmatter + decisions tracker
  → returns: [{id, description, status, closed_date, closed_by}]

query_findings(phase?, type?, topic?)
  → reads findings/ frontmatter
  → returns: [{filename, type, phase, topic, status, date}]

query_conclusions(phase?, alignment_verified?)
  → reads conclusions/ frontmatter
  → returns: [{filename, type, phase, topic, alignment_verified}]

get_project_state()
  → returns: {
      active_phase, open_decisions_count, poc_roadmap_summary,
      unverified_conclusions_count, pending_wiki_confirmations
    }

surface_context(topic)
  → implements Librarian priority order: conclusions > results > field-notes
  → returns: [{filename, type, relevance_note, excerpt}] ordered by priority
```

### D4. Consumer integration

`canon init` adds a new prompt: "Enable MCP knowledge server? [y/N]"

If yes, writes to `.claude/settings.json`:
```json
{
  "mcpServers": {
    "canon": {
      "command": "node",
      "args": ["node_modules/@nicolas-botero-mejia/canon/bin/mcp-server.mjs"]
    }
  }
}
```

`canon sync` — if the consumer previously opted into MCP, sync checks that the `mcpServers` block still points to the correct path (version update safety).

`canon doctor` — adds a check: if `mcpServers.canon` is present, verify `bin/mcp-server.mjs` resolves.

### D5. Update system-tool-integration.md

**Note:** `system-tool-integration.md` was created in v0.1.4 Step 5a with the full `## Claude Code` section already filled. This step adds a new `## MCP Server` section only — do not recreate or overwrite the existing file.

Add `## MCP Server` section:
- What queries are available (tools list)
- What resources are exposed
- How to start the server (`npx canon-mcp`)
- How to enable in `canon init`
- Frontmatter schema reference

---

## Track E — Verification and version

1. `npm run test:all` — all unit, integration, and hook tests pass
2. `npx canon-mcp` in a test consumer — server starts, responds to `get_project_state()`
3. `query_decisions("01", "open")` — returns correct fixture data
4. `surface_context("token-pipeline")` — returns content in correct priority order
5. `canon doctor` — green on a consumer with MCP enabled
6. Stale ref grep — zero results
7. Add `@modelcontextprotocol/sdk` to `package.json` dependencies
8. Bump `package.json` → `0.2.0`
9. Publish

---

## File change summary

| File | Action |
|------|--------|
| `package.json` | Add test scripts; add `canon-mcp` to bin; add MCP SDK dependency; version → 0.2.0 |
| `test/unit/init.test.mjs` | **Create (new)** |
| `test/unit/sync.test.mjs` | **Create (new)** |
| `test/unit/doctor.test.mjs` | **Create (new)** |
| `test/hooks/hook-dispatcher.test.sh` | **Create (new)** |
| `test/hooks/run.sh` | **Create (new)** |
| `test/integration/run.sh` | **Create (new)** |
| `test/integration/update-safety.sh` | Move from `test/update-safety.sh` + expand |
| `lib/scripts/check-contracts.sh` | **Create (new)** |
| `lib/wiki/system-architecture.md` | Add §9 Parsing Contracts |
| `lib/wiki/system-tool-integration.md` | Add MCP section |
| `lib/wiki/system-template-standards.md` | Add frontmatter convention section |
| `lib/templates/*.md` (select) | Add YAML frontmatter headers — scope TBD after v0.1.4 |
| `bin/mcp-server.mjs` | **Create (new)** |
| `bin/lib/mcp-reader.mjs` | **Create (new)** |
| `bin/commands/init.mjs` | Add MCP opt-in prompt; write mcpServers block |
| `bin/commands/sync.mjs` | Check mcpServers path on sync |
| `bin/commands/doctor.mjs` | Add MCP server check |
| `examples/consumer/.claude/settings.json` | Add mcpServers block (if MCP enabled in example) |
| `bin/hook.sh` | Add check-contracts.sh to Stop chain |

---

## Dependency note

Plan 2 has a hard dependency on Plan 1. Specifically:

- Track B (schema consistency) requires knowing the final template structure from v0.1.4, including `session.plan-template.md`, updated `signal.results-template.md`, and the client/user wiki layers.
- Track C (frontmatter) requires the ⚡ confidence marker format from `/wiki-manage promote`.
- Track D (MCP) requires the frontmatter schema from Track C and the parsing contracts from Track B.
- Track A (tests) requires the final USER_DIRS list and template set from v0.1.4.

**Start Plan 2 only after Plan 1 is committed and verified.**
