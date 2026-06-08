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

The framework uses **open standards** as the canonical shape for its artifacts where tools
agree on the format. Where they diverge, per-tool format adapters handle the difference.

| Standard | What it is | Confirmed support |
|---|---|---|
| `AGENTS.md` | Convergent base-context file | Claude Code (as `CLAUDE.md`), Cursor, Copilot (reads nearest), Codex Cloud, Gemini CLI |
| `SKILL.md` | Portable skill definition — slash-command invocable | Claude Code ✅, Cursor v2.4+ (Jan 2026) ✅. Others: **unconfirmed** — each has a "skills" concept but format portability not verified from docs |
| `MCP` | Model Context Protocol | Claude Code ✅ native, Cursor ✅, Copilot ✅ native (2025), Codex ✅ |

> **SKILL.md portability caveat (survey 2026-06-08):** The previous assumption that SKILL.md
> is universally portable across Copilot/Windsurf/Codex was **not confirmed** from official
> documentation. Copilot has its own "agent skills" system (folders of instructions + scripts
> + resources); Codex has skills; neither explicitly documents SKILL.md compatibility. The
> `write-once, place-many` model applies definitively for Claude Code + Cursor today.
> Re-verify when adding other tools.

**Write-once, place-many (confirmed for Claude Code + Cursor):** canonical artifacts are
authored once and placed into each enabled tool's directory by `canon sync`. Format adapters
handle per-tool structural differences (e.g. `.mdc` frontmatter for Cursor rules).

---

## Tool Capability Matrix

Each cell: `✅ supported` / `⚠️ partial/unconfirmed` / `❌ not supported` — with version/date.

| Feature | Claude Code | Cursor | GitHub Copilot | Windsurf | Codex Cloud |
|---|---|---|---|---|---|
| **Base context file** | `CLAUDE.md` (native) | `AGENTS.md` or `.cursorrules` | `AGENTS.md` (nearest) + `.github/copilot-instructions.md` | ⚠️ status unclear — docs now redirect to Devin Desktop | `AGENTS.md` ✅ |
| **Skills** | ✅ `.claude/skills/` SKILL.md | ✅ `.cursor/skills/` SKILL.md — v2.4, Jan 2026 | ⚠️ own format — "agent skills" (folders + instructions/scripts/resources); SKILL.md portability unconfirmed | ⚠️ unknown — product rebranded | ⚠️ skills confirmed; format unconfirmed |
| **Rules / behavioral** | ✅ `.claude/rules/*.md` (always-apply) | ✅ `.cursor/rules/*.mdc` (`alwaysApply: true`) | ✅ `.github/copilot-instructions.md` (repo-wide); `.github/instructions/*.instructions.md` (path-scoped) | ⚠️ unknown | ⚠️ via `AGENTS.md` embed |
| **Subagents** | ✅ `.claude/agents/` | ✅ `.cursor/agents/` — v0.45+ | ✅ Custom agents (Oct 28, 2025) — via `.github/` config | ⚠️ unknown | ⚠️ partial |
| **Lifecycle hooks** | ✅ `settings.json` — SessionStart, PreToolUse (blocking), PostToolUse, Stop (advisory) | ✅ `hooks.json` — PostToolUse, AfterAgent (v0.47+) | ✅ `.github/hooks/NAME.json` — sessionStart, preToolUse (**fail-closed**), postToolUse, sessionEnd, userPromptSubmitted, errorOccurred, agentStop. CLI + cloud agent. | ⚠️ unknown | ✅ hooks confirmed |
| **MCP resources** | ✅ native — `mcpServers` in `settings.json` | ✅ via MCP setting | ✅ native — repo-level JSON config; both CLI + cloud agent (2025) | ⚠️ unknown | ✅ confirmed |

> **Survey date:** 2026-06-08. Sources: official GitHub Copilot docs (hooks reference, cloud
> agent docs, MCP config docs), Cursor release notes, Claude Code docs.
> **Windsurf:** docs.windsurf.com now permanently redirects to docs.devin.ai (Devin Desktop) —
> Windsurf appears to have been rebranded/acquired by Cognition. All Windsurf cells are marked
> unknown until docs are verified at the new location.
> **Codex Cloud** replaces "Codex CLI" — OpenAI now ships Codex as a cloud agent, not a CLI tool.

### Key corrections vs. previous versions of this matrix

| Tool | Feature | Was | Is |
|---|---|---|---|
| Copilot | Lifecycle hooks | ❌ not supported | ✅ 6 events, preToolUse fail-closed |
| Copilot | MCP | ⚠️ preview | ✅ native (2025) |
| Copilot | Subagents | ⚠️ Extensions only | ✅ Custom agents (Oct 2025) |
| Copilot | Skills | ✅ `.github/skills/` SKILL.md | ⚠️ own format, SKILL.md portability unconfirmed |
| Codex | Hooks | ❌ | ✅ confirmed |
| Codex | MCP | ❌ | ✅ confirmed |
| Windsurf | All features | partially filled | ⚠️ unknown — product rebranded, docs moved |

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
Copilot reads base context from multiple files (nearest takes precedence):
- `AGENTS.md` — reads nearest file in the directory tree
- `.github/copilot-instructions.md` — repo-wide instructions
- `.github/instructions/*.instructions.md` — path-scoped instructions (frontmatter `applyTo` glob)
- `CLAUDE.md` or `GEMINI.md` at repo root (also recognized)

### Lifecycle hooks

Copilot CLI and Copilot cloud agent both support hooks. Configuration: `.github/hooks/NAME.json`
(repo-level, must be on default branch for cloud agent).

| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| `sessionStart` | Session opens | No |
| `userPromptSubmitted` | User submits a prompt | No |
| `preToolUse` | Before tool execution | **Yes — fail-closed** (crash or timeout denies execution) |
| `postToolUse` | After tool execution | No |
| `errorOccurred` | Error during execution | No |
| `sessionEnd` / `agentStop` | Session ends | No |

**Hook types:** command (bash/powershell), HTTP (POST to URL), prompt (CLI-only, auto-submits text).
**Hook output:** must be valid JSON on a single line. Input JSON contains `timestamp`, `cwd`, `toolName`, `toolArgs`.

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "bash .github/hooks/pre-tool-check.sh",
        "powershell": ".github/hooks/pre-tool-check.ps1",
        "timeoutSec": 10
      }
    ]
  }
}
```

### Agent skills
Copilot has an "agent skills" system — folders containing instructions, scripts, and resources
that the agent loads when relevant. **File format: Copilot's own proprietary folder structure.**
SKILL.md portability (same format as Claude Code + Cursor) has not been confirmed from official
documentation. Do not assume SKILL.md places correctly into Copilot without verification.

### Custom agents
Configurable specialized agents announced Oct 28, 2025. Define via `.github/` config with
custom prompts, tool selections, and MCP server connections. Works across github.com, Copilot
CLI, and VS Code.

### MCP
Native support — configured at repo level via JSON. Both Copilot CLI and cloud agent.
`mcpServers` object; supports `local`, `stdio`, `http`, `sse` types. Available since 2025.

### Known limitations
- `preToolUse` fail-closed behavior differs from Claude Code (where exit 2 blocks but a crash
  does not necessarily). Timeouts also deny execution in Copilot.
- Hook scripts run in the Copilot cloud agent's ephemeral Linux sandbox — files written by
  hooks are discarded when the job ends.
- SKILL.md portability for Copilot's agent skills system is unconfirmed — verify before
  assuming the framework's skills vendor correctly into Copilot directories.

---

## Windsurf

> **⚠️ Status as of 2026-06-08:** Windsurf's documentation domain (`docs.windsurf.com`)
> now permanently redirects to `docs.devin.ai` (Devin Desktop by Cognition). Windsurf appears
> to have been acquired/rebranded. All capability claims below are from pre-acquisition
> documentation and should be re-verified before relying on them.

### Base context (pre-acquisition, unverified)
`AGENTS.md` (native). Also reportedly read `.windsurfrules` for legacy compatibility.

### Skills / rules / hooks (pre-acquisition, unverified)
Prior documentation referenced `.windsurf/rules/` for behavioral rules and a Cascade-model
skills system. Hook support was not documented. MCP was reportedly supported.

### Action required
Before adding Windsurf to the tools registry, re-survey the current product at `docs.devin.ai`
to confirm what is now supported under the Devin Desktop / Windsurf branding.

---

## Codex Cloud

> **Note:** OpenAI now ships Codex as **Codex Cloud** (cloud agent), not a standalone CLI tool.
> The following is based on available documentation as of 2026-06-08; some details
> (exact file paths for skills, hook format) remain to be verified.

### Base context
`AGENTS.md` — confirmed supported.

### Lifecycle hooks
Confirmed supported. Exact hook event names, config file location, and blocking behavior
require verification from full Codex docs.

### Skills
Confirmed as a concept. File format and directory structure require verification —
do not assume SKILL.md portability without confirming from Codex documentation.

### MCP
Confirmed supported for tool integration and connectors.

### Known limitations
- Codex operates as a background/cloud agent — session lifecycle model may differ from
  interactive tools.
- Skills format, hook config path, and exact event names are not yet fully documented
  in publicly available sources. Mark all Codex cells as provisional until verified.

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
