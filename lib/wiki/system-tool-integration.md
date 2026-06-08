# System — Tool Integration

**Last updated:** 2026-06-08

> `**Last updated:**` = date of the last **global capability survey** across all supported tools.
> When this date is more than ~3 months old, re-run the survey before relying on the capability
> matrix. Per-cell version tags show when each feature was introduced per tool.

**Scope:** How each supported AI tool consumes the framework — lifecycle events, configuration
format, hook output format, known limitations. The canonical reference for multi-tool support
decisions; the declarative twin of the CLI tools registry.

See `system-invariants.md` for cross-tool invariants (R-006 behavioral mirror, R-010 base file,
R-012 wiki path drift, R-011 Stop hook behavior).

---

## Standards Alignment Model (June 2026)

The framework uses **open standards** as the canonical shape for its artifacts so that they
work across tools without per-tool content generation:

| Standard | What it is | Supported by |
|---|---|---|
| `AGENTS.md` | Convergent base-context file (Linux Foundation / Agentic AI Foundation, 60k+ repos) | Claude Code, Cursor, Copilot, Windsurf, Codex CLI, Gemini CLI, Zed |
| `SKILL.md` | Portable skill definition — slash-command invocable | Claude Code, Cursor (v2.4+), Copilot (2026), Windsurf Cascade, Codex CLI |
| `MCP` | Model Context Protocol — structured resource + tool exposure | Claude Code (native), Cursor (via MCP setting), Copilot (MCP preview), Windsurf |

**Write-once, place-many:** canonical artifacts (skills, agents, rules, base context) are
authored once in open-standard shapes and **placed** into each enabled tool's directory by
`canon sync`. No content generation — only format adapters for the small per-tool structural
differences (e.g. `.mdc` frontmatter for Cursor rules).

**Adding a tool:** one entry in the tools registry below → `init.mjs`/`sync-ops.mjs`/
`manifest.json` pick it up. No hardcoded tool names; no architecture change.

---

## Tool Capability Matrix

Each cell: `✅ supported` / `⚠️ partial` / `❌ not supported` — with version/date when introduced.

| Feature | Claude Code | Cursor | GitHub Copilot | Windsurf | Codex CLI |
|---|---|---|---|---|---|
| **Base context file** | `CLAUDE.md` (native, always loaded) | `AGENTS.md` or `.cursorrules` | `AGENTS.md` (2026) / `.github/copilot-instructions.md` | `AGENTS.md` (2025) | `AGENTS.md` (2026) |
| **Skills (`SKILL.md`)** | ✅ `.claude/skills/` | ✅ `.cursor/skills/` — v2.4, Jan 2026 | ✅ `.github/skills/` — 2026 | ✅ `.windsurf/skills/` — Cascade, 2026 | ✅ `.codex/skills/` — 2026 |
| **Rules / behavioral** | ✅ `.claude/rules/` (always-apply `.md`) | ✅ `.cursor/rules/` (`.mdc`, `alwaysApply: true`) | ✅ `.github/instructions/` — 2026 | ✅ `.windsurf/rules/` — 2026 | ⚠️ via `AGENTS.md` embed |
| **Subagents** | ✅ `.claude/agents/` | ✅ `.cursor/agents/` — v0.45+ | ⚠️ Copilot Extensions (separate) | ⚠️ limited | ⚠️ limited |
| **Lifecycle hooks** | ✅ `settings.json` — SessionStart, PreToolUse, PostToolUse, Stop | ✅ `hooks.json` — AfterAgent, PostToolUse (v0.47+, 2026) | ❌ not supported | ❌ not supported | ❌ not supported |
| **MCP resources** | ✅ native, `mcpServers` in `settings.json` | ✅ via MCP setting | ⚠️ MCP preview (2026) | ✅ native MCP | ❌ |

> **Survey date:** 2026-06-08. Feature support verified via official documentation and release
> notes. Cells marked with a version/date reflect when that feature was introduced — earlier
> versions of the tool may not support it.

---

## Tools Registry (declarative model)

The CLI iterates this structure. Each entry declares everything needed to vendor artifacts and
write wiring for that tool. `init.mjs` and `sync-ops.mjs` will be refactored to read this
registry — replacing the ~7 hardcoded `claude`/`cursor` spots.

```js
// tools-registry.mjs (planned — Phase 2E)
export const TOOLS = [
  {
    id: 'claude',
    name: 'Claude Code',
    baseFile: 'CLAUDE.md',            // written to consumer root
    dirs: {
      skills:  '.claude/skills',
      agents:  '.claude/agents',
      rules:   '.claude/rules',
      hooks:   null,                  // hooks wired via settings.json, not a dir
    },
    configFile: '.claude/settings.json',
    configFormat: 'json',
    eventMap: {
      sessionStart: 'SessionStart',
      preToolUse:   'PreToolUse',
      postToolUse:  'PostToolUse',
      stop:         'Stop',
    },
    ioFields: {
      toolPath:  'tool_input.file_path',
      decision:  'decision',
    },
    formatAdapters: [],               // .md rules, no transformation needed
  },
  {
    id: 'cursor',
    name: 'Cursor',
    baseFile: 'AGENTS.md',            // Cursor reads AGENTS.md natively
    dirs: {
      skills:  '.cursor/skills',
      agents:  '.cursor/agents',
      rules:   '.cursor/rules',
      hooks:   '.cursor/hooks',
    },
    configFile: '.cursor/hooks.json',
    configFormat: 'json',
    eventMap: {
      postToolUse: 'PostToolUse',
      afterAgent:  'AfterAgent',
    },
    ioFields: {
      toolPath:  'file_path',         // Cursor uses file_path, not tool_input.file_path
    },
    formatAdapters: ['mdc-frontmatter'], // .mdc rules need frontmatter block
  },
  // Adding a new tool: copy one entry above, fill in its dirs/config/eventMap/ioFields.
  // No code changes to init.mjs or sync-ops.mjs — they iterate this array.
]
```

The `formatAdapters` field references named transforms in `bin/lib/format-adapters.mjs` (Phase 2E).
Current adapters needed: `mdc-frontmatter` (prepend `---\ndescription: ...\nalwaysApply: true\n---`).

---

## Claude Code

### Lifecycle events

| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| SessionStart | Session opens | No — advisory only; exit code ignored |
| PreToolUse | Before any tool call | Yes — exit 2 blocks |
| PostToolUse | After any tool call | Only via JSON `{ "decision": "block" }` with exit 0 — exit 2 alone is NOT blocking |
| Stop | Session ends | **No — advisory only** (exit code ignored; see ADR-013) |

### Configuration
`.claude/settings.json` — hooks array under each event name. Written by `canon init`.

### Hook output format
Scripts communicate back to Claude via stdout JSON:
- Advisory: `{ "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." } }`
- Block (PostToolUse only): `{ "decision": "block", "reason": "...", "hookSpecificOutput": {...} }`
- PreToolUse block: exit 2 (no JSON needed)

### Skills
`/skill-name` — loaded from `.claude/skills/[name]/SKILL.md`. Agents invoked as subagents.

### Known limitations
- PostToolUse: exit 2 alone is non-blocking. Hard blocks require JSON `{ "decision": "block" }` with exit 0.
- Stop event: **exit 2 does not block session close**. All Stop hooks are advisory. (See `system-invariants.md R-011` and ADR-013.)
- SessionStart: always advisory — cannot block session open.

---

## Cursor

### Lifecycle events
| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| PostToolUse | After any tool call | Yes — via hook response |
| AfterAgent | After agent completes | No |

Available since: v0.47+ (PostToolUse), 2026.

### Configuration
`.cursor/hooks.json` — written by `canon init` if Cursor layer is enabled.

### Hook output format
Scripts receive context via environment variables. The tool path field is `file_path`
(not `tool_input.file_path` as in Claude Code — see `system-invariants.md R-011` / Phase 2D fix).

### Rules format
`.cursor/rules/` — `.mdc` files with YAML frontmatter:
```yaml
---
description: <purpose>
alwaysApply: true
---
```

### Skills
`.cursor/skills/[name]/SKILL.md` — identical format to Claude Code skills (portable `SKILL.md`
standard). Available since Cursor v2.4, January 2026.

### Known limitations
- `file_path` vs `tool_input.file_path`: Cursor uses `file_path` directly; Claude Code wraps it.
  Hook scripts must handle both or use the tools registry `ioFields` to look up the right field.
- `.mdc` rules require the YAML frontmatter block; plain `.md` files are ignored by Cursor.

---

## GitHub Copilot

### Base context
`AGENTS.md` (preferred, 2026) or `.github/copilot-instructions.md`. The framework targets
`AGENTS.md` as the canonical base file — no Copilot-specific base file needed.

### Skills / instructions
`.github/skills/[name]/SKILL.md` — same format as Claude Code and Cursor. Available 2026.
`.github/instructions/` — behavioral rules (`.md` format, `applyTo` field for scoping).

### Lifecycle hooks
Not supported. Copilot does not expose pre/post tool use hooks.

### Known limitations
- No hook support — governance enforcement via rules only (no session-close checks).
- Subagents via Copilot Extensions are a separate model (separate API, not SKILL.md based).

---

## Windsurf

### Base context
`AGENTS.md` (native, 2025). Also reads `.windsurfrules` for legacy compatibility.

### Skills / rules
`.windsurf/skills/[name]/SKILL.md` — Cascade model, 2026.
`.windsurf/rules/` — behavioral rules in `.md` format.

### Lifecycle hooks
Not supported.

### Known limitations
- No hook support — governance enforcement via rules only.
- Cascade architecture means agent interactions differ from Claude Code's explicit tool calls.

---

## Codex CLI

### Base context
`AGENTS.md` (native, 2026). Reads from project root.

### Skills
`.codex/skills/[name]/SKILL.md` — available 2026.

### Lifecycle hooks
Not supported. Codex CLI operates as a one-shot agent; no persistent session lifecycle.

### Known limitations
- No hook support.
- Skills invocation model may differ from interactive tools — verify slash-command syntax.

---

## MCP Server

Canon ships an optional MCP knowledge server (`bin/mcp-server.mjs`) that exposes project knowledge as structured resources and query tools. It is read-only — all writes go through the CLI and skills.

### Enabling

During `canon init`, answer **y** to "Enable MCP knowledge server?" — or run `canon init --force` to re-run the prompt. This writes the `mcpServers` block into `.claude/settings.json`:

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

To start manually: `npx canon-mcp` (from the consumer project root).

> **Known bug (Phase 2D):** `canon sync` currently overwrites `.claude/settings.json` before
> reading back `mcpServers` — this wipes the MCP configuration on sync. Fix tracked in
> `system-invariants.md` and `sync.mjs:23`. Do not run `canon sync` until this is fixed if
> you have MCP configured.

### Resources

| URI pattern | Content |
|-------------|---------|
| `canon://wiki/{layer}/{filename}` | Wiki files (project, client, user, standards) |
| `canon://findings/{filename}` | Findings files |
| `canon://conclusions/{filename}` | Conclusions files |
| `canon://deliverables/{filename}` | Client-facing deliverables |
| `canon://plans/{filename}` | Plan files |
| `canon://CONTENT_INDEX.md` | Full content index |

### Tools

| Tool | Parameters | Returns |
|------|-----------|---------|
| `query_decisions(phase, status?)` | Phase number; optional status filter | `[{id, description, status, closed}]` |
| `query_findings(phase?, type?, topic?, discovery_type?)` | Any frontmatter field | `[{filename, type, phase, topic, status, date}]` |
| `query_conclusions(phase?, alignment_verified?)` | Phase; optional verification filter | `[{filename, type, phase, topic, alignment_verified}]` |
| `get_project_state()` | — | `{active_phase, open_decisions_count, poc_roadmap_summary, unverified_conclusions_count, pending_wiki_confirmations}` |
| `surface_context(topic)` | Topic slug or keyword | Files ordered by Librarian priority: conclusions > results > field-notes |

### Frontmatter schema

MCP tools read YAML frontmatter from findings and conclusions files. See `system-template-standards.md §YAML frontmatter convention` for the full schema. Key fields:

- `type` — file category (e.g. `poc-results`, `signal-results`, `conclusions`)
- `phase` — phase number string
- `topic` — slug for filtering
- `status` — `in-progress` | `complete`
- `alignment_verified` — empty string or `YYYY-MM-DD` date (conclusions only)
- `discovery_type` — `external` | `internal` (signal-results only)

---

## Adding a new tool integration

The intended workflow after Phase 2E (tools registry refactor):

1. Add a new entry to `bin/lib/tools-registry.mjs` with the tool's `dirs`, `configFile`,
   `configFormat`, `eventMap`, `ioFields`, and `formatAdapters`
2. If the tool needs a format adapter not yet implemented, add it to `bin/lib/format-adapters.mjs`
3. Add the tool to the capability matrix above with version/date for each supported feature
4. Update `**Last updated:**` at the top of this file to today's date
5. Run `npm test` — the invariants test will catch any registry/docs agreement failures
6. Verify by running `canon init` in a test consumer project and confirming the tool's dirs,
   config file, and base-context file are all written correctly

`system-architecture.md` and `system-operations.md` do not need updating for new tool wiring.

**Until Phase 2E lands (tools registry refactor is complete):** follow the legacy procedure —
update `init.mjs`, `sync-ops.mjs`, and `manifest.json` manually for the new tool, and add a
section to this file.
