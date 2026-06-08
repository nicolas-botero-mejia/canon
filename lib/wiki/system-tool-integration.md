# System — Tool Integration

**Last updated:** 2026-06-08

> `**Last updated:**` = date of the last **global capability survey** across all supported tools.
> When this date is more than ~3 months old, re-run the survey before relying on the capability
> matrix. Per-cell version/date tags show when each feature was introduced per tool.

**Scope:** How each supported AI tool consumes the framework — lifecycle events, configuration
format, hook output format, known limitations. The canonical reference for multi-tool support
decisions; the declarative twin of the CLI tools registry.

See `system-invariants.md` for cross-tool invariants (R-006 behavioral mirror, R-010 base file,
R-012 wiki path drift, R-011 Stop hook behavior).

---

## Standards Alignment Model (surveyed 2026-06-08)

### Agent Skills open standard

Agent Skills is an open standard **originated by Anthropic**, released to the ecosystem, and
now adopted by 30+ AI tools including Claude Code, Cursor, GitHub Copilot, Codex, VS Code,
Gemini CLI, JetBrains Junie, Roo Code, and more. Governed at **agentskills.io**.

**Core format — `SKILL.md`:**
```yaml
---
name: skill-name            # required; lowercase + hyphens; max 64 chars; must match directory name
description: |              # required; max 1024 chars; what it does AND when to use it
  Extracts text from PDFs. Use when working with PDF documents.
license: Apache-2.0         # optional
compatibility: Requires git # optional; environment requirements
metadata:                   # optional; arbitrary key-value
  author: example-org
  version: "1.0"
allowed-tools: Bash Read    # optional (experimental); pre-approved tools
---

Skill instructions here — Markdown, no format restrictions.
Recommended under 500 lines. Move detailed reference to files in references/.
```

Optional directories alongside `SKILL.md`: `scripts/`, `references/`, `assets/`.

**Progressive disclosure:** agents load only `name` + `description` at startup (~100 tokens),
full instructions when a task activates the skill, referenced files only when needed.

### Skill discovery paths

Each tool checks multiple paths. The **cross-tool convergent path** is `.agents/skills/`.

| Path | Scope | Read by |
|---|---|---|
| `.agents/skills/[name]/` | Project (repo-level) | Cursor, Codex, Copilot, Gemini CLI, VS Code, most agentskills.io tools |
| `.claude/skills/[name]/` | Project | Claude Code (primary), Cursor (compat), Copilot CLI+cloud+VS Code (native) |
| `.github/skills/[name]/` | Project | Copilot CLI + cloud agent + VS Code (primary for Copilot) |
| `.cursor/skills/[name]/` | Project | Cursor (primary) |
| `.gemini/skills/[name]/` | Project | Gemini CLI (primary) |
| `~/.agents/skills/[name]/` | User-global | Cursor, Codex, Copilot, Gemini CLI |
| `~/.claude/skills/[name]/` | User-global | Claude Code, Cursor (compat), Copilot |
| `~/.copilot/skills/[name]/` | User-global | Copilot CLI |

> **Key implication for the framework:** `.claude/skills/` is read natively by Claude Code,
> Cursor, Copilot CLI, Copilot cloud agent, and VS Code. The framework's existing skills work
> across these tools **without any vendoring step** for skills. For Codex and Gemini CLI,
> `.agents/skills/` is the primary path — consider symlinking or adding `.agents/skills/` as
> an alias in the tools registry.

### Other standards

| Standard | What it is | Confirmed support |
|---|---|---|
| `AGENTS.md` | Convergent base-context file (Linux Foundation / Agentic AI Foundation, 60k+ repos) | Claude Code (as `CLAUDE.md` via `@import`), Cursor, Copilot (reads nearest `AGENTS.md`), Codex, Gemini CLI |
| `MCP` | Model Context Protocol — structured resource + tool exposure | Claude Code ✅ native, Cursor ✅, Copilot ✅ native (2025), Codex ✅ |

---

## Tool Capability Matrix

`✅ confirmed` / `⚠️ partial or unconfirmed` / `❌ not supported`

| Feature | Claude Code | Cursor | Copilot CLI | Copilot Cloud Agent | VS Code (Copilot) | Codex | Gemini CLI |
|---|---|---|---|---|---|---|---|
| **Base context** | `CLAUDE.md` (native) | `AGENTS.md` or `.cursorrules` | `AGENTS.md` nearest + `.github/copilot-instructions.md` | same as CLI | same as CLI | `AGENTS.md` ✅ | `AGENTS.md` ✅ |
| **Skills (SKILL.md)** | ✅ `.claude/skills/` — slash cmd | ✅ `.agents/skills/` or `.cursor/skills/` — auto + slash cmd (v2.4) | ✅ `.github/skills/`, `.claude/skills/`, `.agents/skills/` — auto-applied | ✅ same paths | ✅ same paths as CLI | ✅ `.agents/skills/` — auto + explicit (`/` or `$` prefix) | ✅ `.gemini/skills/` or `.agents/skills/` — auto |
| **Rules / behavioral** | ✅ `.claude/rules/*.md` (always-apply) | ✅ `.cursor/rules/*.mdc` (`alwaysApply: true`) | ✅ `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md` | ✅ same | ✅ same | ✅ via `AGENTS.md` + `.codex/` config | ✅ `AGENTS.md` + `.gemini/` config |
| **Subagents** | ✅ `.claude/agents/` (Markdown) | ✅ `.cursor/agents/` (v0.45+) | ✅ Custom agents (Oct 2025) | ✅ Custom agents | ✅ via Copilot | ✅ `.codex/agents/*.toml` — **TOML, not Markdown** | ⚠️ unconfirmed |
| **Lifecycle hooks** | ✅ `settings.json` — 4 events | ✅ `hooks.json` — 2 events (v0.47+) | ✅ `.github/hooks/NAME.json` — 7 events (preToolUse **fail-closed**) | ✅ same paths; fewer events (no notification, no permissionRequest) | ✅ PascalCase variant | ✅ `.codex/hooks.json` or `config.toml` — 9+ events (preToolUse blocking) | ❌ unconfirmed |
| **MCP** | ✅ native, `settings.json` | ✅ via MCP setting | ✅ native (2025), repo-level JSON | ✅ same | ✅ same | ✅ confirmed | ✅ confirmed |

> **Windsurf:** `docs.windsurf.com` permanently redirects to `docs.devin.ai` (Devin Desktop).
> Windsurf appears acquired/rebranded by Cognition. All Windsurf cells omitted until re-verified.

### Key corrections vs. prior matrix versions

| Tool | Feature | Was | Now (corrected) |
|---|---|---|---|
| Copilot | Hooks | ❌ not supported | ✅ 7 events, preToolUse fail-closed — both CLI and cloud agent |
| Copilot | MCP | ⚠️ preview | ✅ native (2025) |
| Copilot | Subagents | ⚠️ Extensions only | ✅ Custom agents (Oct 2025) |
| Copilot | Skills | ⚠️ own format assumed | ✅ SKILL.md standard; reads `.claude/skills/` natively |
| Codex | Hooks | ❌ | ✅ comprehensive (9+ events, blocking preToolUse) |
| Codex | MCP | ❌ | ✅ confirmed |
| Codex | Skills | ⚠️ unconfirmed | ✅ `.agents/skills/`, SKILL.md standard |
| Codex | Subagents | ⚠️ unconfirmed | ✅ but TOML format (`.codex/agents/*.toml`) — not portable from Claude Code |
| All | SKILL.md portability | "unconfirmed for most" | ✅ open standard (agentskills.io); confirmed for Claude Code, Cursor, Copilot, Codex, Gemini CLI, VS Code |

---

## Claude Code

### Lifecycle events

| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| `SessionStart` | Session opens | No — advisory only; exit code ignored |
| `PreToolUse` | Before any tool call | Yes — exit 2 blocks |
| `PostToolUse` | After any tool call | Only via JSON `{ "decision": "block" }` with exit 0 — exit 2 alone is NOT blocking |
| `Stop` | Session ends | **No — advisory only** (exit code ignored; see ADR-013) |

### Configuration
`.claude/settings.json` — hooks array under each event name. Written by `canon init`.

### Hook output format
- Advisory: `{ "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." } }`
- Block (PostToolUse only): `{ "decision": "block", "reason": "...", "hookSpecificOutput": {...} }`
- PreToolUse block: exit 2 (no JSON needed)

### Skills
`/skill-name` — loaded from `.claude/skills/[name]/SKILL.md`. Explicit slash-command invocation.
Agents invoked as subagents from skills using the Agent tool.

### Known limitations
- PostToolUse: exit 2 alone is non-blocking. Hard blocks require JSON `{ "decision": "block" }` with exit 0.
- Stop event: advisory only. See `system-invariants.md R-011` and ADR-013.

---

## Cursor

### Skills
Skills loaded from `.agents/skills/` (primary) or `.cursor/skills/`. Also reads `.claude/skills/`
and `.codex/skills/` for backward compatibility — framework skills in `.claude/skills/` work
natively in Cursor without vendoring.

Invocation: auto-applied by context, or manually via `/skill-name` in Agent chat.
`disable-model-invocation: true` in frontmatter → explicit slash command only.
Version: v2.4+ (January 2026); `/migrate-to-skills` skill available for migration.

### Lifecycle events

| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| `PostToolUse` | After any tool call | Yes — via hook response |
| `AfterAgent` | After agent completes | No |

Config: `.cursor/hooks.json`. Available since v0.47+, 2026.

### Rules
`.cursor/rules/*.mdc` files with YAML frontmatter:
```yaml
---
description: <purpose>
alwaysApply: true
---
```

### Subagents
`.cursor/agents/` — available since v0.45+.

### Known limitations
- `file_path` vs `tool_input.file_path`: Cursor uses `file_path` directly; Claude Code wraps it.
- `.mdc` rules require YAML frontmatter block; plain `.md` files are ignored.

---

## GitHub Copilot

Copilot spans three hosts: **CLI**, **cloud agent** (github.com), and **VS Code**. All share the
same skill discovery paths and hook config location (`.github/hooks/NAME.json`), but differ in
what hook events are available and how scripts execute.

### Skills (all Copilot hosts)

**Confirmed SKILL.md standard** — same format as Claude Code and Cursor.

Discovery paths (all Copilot hosts check all of these):
- `.github/skills/[name]/` — Copilot primary
- `.claude/skills/[name]/` — also discovered natively
- `.agents/skills/[name]/` — also discovered natively
- `~/.copilot/skills/[name]/`, `~/.claude/skills/[name]/`, `~/.agents/skills/[name]/` — user-level

**Invocation:** auto-applied based on task context + skill `description`. No slash command
in cloud/CLI (VS Code supports manual `/skill-name` in chat).

**Key implication:** `.claude/skills/` is natively discovered. Framework skills require NO
vendoring step for any Copilot host.

### Base context (all Copilot hosts)
Reads in order (nearest takes precedence):
- `AGENTS.md` — nearest file in directory tree
- `.github/copilot-instructions.md` — repo-wide
- `.github/instructions/*.instructions.md` — path-scoped (`applyTo` glob in frontmatter)
- `CLAUDE.md` or `GEMINI.md` at repo root (also recognized)

### Lifecycle hooks

**Config:** `.github/hooks/NAME.json` (repo-level; must be on default branch for cloud agent).
User-level (CLI only): `~/.copilot/hooks/`.

**Three hook types:** `command` (bash/PowerShell scripts), `http` (POST to URL), `prompt` (CLI only — auto-submits text).

| Event | Blocking? | CLI | Cloud Agent | VS Code |
|-------|-----------|-----|-------------|---------|
| `sessionStart` | Injects context | ✅ | ✅ | ✅ |
| `preToolUse` | **Yes — fail-closed** (crash/timeout denies) | ✅ | ✅ | ✅ |
| `postToolUse` | Yes — modifies result or injects context | ✅ | ✅ | ✅ |
| `agentStop`/`subagentStop` | Yes — forces another turn | ✅ | ✅ | ✅ |
| `permissionRequest` | Yes — allows/denies programmatically | ✅ | ❌ (use preToolUse instead) | ✅ |
| `userPromptSubmitted` | No | ✅ | ✅ | ✅ |
| `errorOccurred` | No | ✅ | ✅ | ✅ |
| `sessionEnd` | No | ✅ | ✅ | ✅ |
| `notification` | No (fire-and-forget) | ✅ | ❌ | ✅ |
| `prompt` hooks | Auto-submits text | ✅ (new sessions) | ⚠️ may not fire | ✅ |

**Hook config format:**
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

**To deny execution from `preToolUse`:**
```json
{ "permissionDecision": "deny", "permissionDecisionReason": "reason here" }
```
Exit code 2 also denies for `permissionRequest` hooks.

**JSON format variants:** camelCase (`sessionStart`) and PascalCase/snake_case (`SessionStart`) — both accepted; PascalCase for VS Code compatibility.

### CLI vs Cloud Agent differences

| Aspect | CLI | Cloud Agent |
|--------|-----|-------------|
| `notification` hook | ✅ fires | ❌ does not fire |
| `permissionRequest` hook | ✅ use for interactive approval | ❌ tools pre-approved; use `preToolUse` |
| `prompt` hooks | ✅ fires on new sessions | ⚠️ may not fire (non-interactive) |
| Shell | bash + PowerShell | bash only |
| Network in hooks | Unrestricted | Firewall-restricted (HTTPS to allowlisted hosts only) |
| File writes from hooks | Persist | Discarded (ephemeral sandbox) |

> **Framework relevance:** the framework's consumer uses repo-level hooks (`.github/hooks/`)
> which work for both CLI and cloud agent. Cloud agent limitations (no `permissionRequest`,
> bash-only, restricted network, ephemeral filesystem) should be kept in mind when writing
> hook scripts that need to work in both contexts.

### Custom agents
Configurable specialized agents announced Oct 28, 2025. Defined via `.github/` config with
custom prompts, tool selections, MCP server connections. Works across github.com, Copilot CLI,
and VS Code.

### MCP
Native support — both CLI and cloud agent. Repo-level JSON config (`mcpServers` object).
Supports `local`, `stdio`, `http`, `sse` types. Available since 2025.

---

## Codex (OpenAI Codex Cloud)

> Codex is a **cloud agent** — not a CLI tool. Sessions run in OpenAI's cloud environment.
> All paths below refer to the cloned repository's file structure.

### Skills
**Confirmed SKILL.md standard** — follows agentskills.io open standard.

Primary directory: `.agents/skills/[name]/` (repo-level).
User-level: `~/.agents/skills/[name]/`.

Invocation: explicit (`/skills` command or `$` prefix) OR implicit (auto-selected by context).

### Lifecycle hooks

Config: `.codex/hooks.json` or `.codex/config.toml`.

| Event | Blocking? |
|-------|-----------|
| `SessionStart` | No |
| `SubagentStart` / `SubagentStop` | SubagentStop can force another turn |
| `PreToolUse` | **Yes — blocks tool execution; deny with reason** |
| `PostToolUse` | Yes — can block/modify after execution |
| `PermissionRequest` | Yes — approve or deny |
| `PreCompact` / `PostCompact` | No |
| `UserPromptSubmit` | Yes — can block prompt submission |
| `Stop` | Can force continuation rather than block |

Input: JSON on stdin (`session_id`, `cwd`, `hook_event_name` + event-specific fields).
Output: JSON to stdout (`continue`, `stopReason`, event-specific control fields).

### Subagents
**Codex-specific TOML format** — `.codex/agents/[name].toml`.
Required fields: `name`, `description`, `developer_instructions`.
Optional: `model`, `sandbox_mode`, `mcp_servers`.

**Not portable from Claude Code:** Claude Code uses Markdown agent files (`.claude/agents/*.md`);
Codex uses TOML. Content can be adapted but not directly placed.

### Base context
`AGENTS.md` — loaded from `~/.codex/AGENTS.md` (global) and repo root/nested directories.

### MCP
Confirmed supported.

### Known limitations
- Subagent format (TOML) is not compatible with Claude Code's Markdown agent format.
- File paths within hook config must be relative to the cloned repo root.

---

## Gemini CLI

### Skills
**Confirmed SKILL.md standard** — follows agentskills.io open standard.

Primary directory: `.gemini/skills/[name]/` or `.agents/skills/[name]/` (alias, interchangeable).
User-level: `~/.gemini/skills/[name]/`.

Invocation: auto-applied (four-stage: discovery → activation → consent → injection).
Manual management: `/skills list`, `/skills enable`, `gemini skills install`.

### Base context
`AGENTS.md` — confirmed supported.

### Known limitations
- Consent step: Gemini CLI may prompt user approval before injecting a skill — differs from
  silent auto-application in other tools.
- Hooks: not confirmed as of 2026-06-08 survey.

---

## Windsurf

> **⚠️ Status as of 2026-06-08:** `docs.windsurf.com` permanently redirects to `docs.devin.ai`
> (Devin Desktop by Cognition). Windsurf appears acquired/rebranded. All capability claims
> are unverified. Re-survey before adding Windsurf to the tools registry.

---

## MCP Server (Canon's own)

Canon ships an optional MCP knowledge server (`bin/mcp-server.mjs`) that exposes project
knowledge as structured resources and query tools. It is read-only — all writes go through
the CLI and skills.

### Enabling

During `canon init`, answer **y** to "Enable MCP knowledge server?" This writes:

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

> **Known bug (Phase 2D):** `canon sync` currently overwrites `.claude/settings.json` before
> reading back `mcpServers` — MCP configuration is wiped on sync. See `sync.mjs:23`. Do not
> run `canon sync` until fixed if MCP is configured.

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

Key fields read by MCP tools — full schema in `system-template-standards.md §YAML frontmatter`:
- `type` — file category (e.g. `poc-results`, `signal-results`, `conclusions`)
- `phase` — phase number string
- `topic` — slug for filtering
- `status` — `in-progress` | `complete`
- `alignment_verified` — empty string or `YYYY-MM-DD` (conclusions only)
- `discovery_type` — `external` | `internal` (signal-results only)

---

## Tools Registry (declarative model — Phase 2E)

The CLI will iterate this structure after the Phase 2E refactor. Each entry declares everything
needed to vendor artifacts and write wiring for that tool. Replaces the ~7 hardcoded
`claude`/`cursor` spots in `init.mjs`, `sync-ops.mjs`, and `manifest.json`.

```js
// bin/lib/tools-registry.mjs (planned — Phase 2E)
export const TOOLS = [
  {
    id: 'claude',
    name: 'Claude Code',
    baseFile: 'CLAUDE.md',
    dirs: {
      skills:  '.claude/skills',   // also read natively by Cursor + Copilot — no extra placement needed
      agents:  '.claude/agents',
      rules:   '.claude/rules',
      hooks:   null,               // wired via settings.json
    },
    configFile: '.claude/settings.json',
    configFormat: 'json',
    eventMap: {
      sessionStart: 'SessionStart',
      preToolUse:   'PreToolUse',
      postToolUse:  'PostToolUse',
      stop:         'Stop',
    },
    ioFields: { toolPath: 'tool_input.file_path' },
    formatAdapters: [],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    baseFile: 'AGENTS.md',
    dirs: {
      skills:  '.cursor/skills',   // cursor's primary; .claude/skills also read natively
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
    ioFields: { toolPath: 'file_path' },
    formatAdapters: ['mdc-frontmatter'],
  },
  // Future: copilot, codex, gemini — one entry each; .agents/skills/ is the cross-tool path
  // Copilot skills: no vendoring needed (.claude/skills/ is natively discovered)
  // Codex/Gemini skills: add .agents/skills/ placement or symlink
]
```

**Note on `.agents/skills/`:** The convergent cross-tool standard path. Consider adding a
`.agents/skills/` symlink or placement step for Codex and Gemini CLI support alongside
`.claude/skills/`.

---

## Adding a new tool integration (current procedure — pre Phase 2E)

1. Add a new section to this file with: lifecycle events, config format, hook output format,
   skill discovery paths, known limitations
2. Add the tool to the capability matrix above with version/date per feature
3. Verify SKILL.md discovery: does the tool read `.claude/skills/` natively? If not, does it
   read `.agents/skills/`? Plan vendoring or symlinking accordingly
4. Update `**Last updated:**` at top to today's date
5. Update `bin/commands/init.mjs` to prompt for the new layer and write config
6. Update `bin/lib/sync-ops.mjs` to vendor any files the tool doesn't auto-discover
7. Add tool's config file(s) to `manifest.json` wiring
8. Run `npm test` — invariants test will catch registry/docs agreement failures

Post Phase 2E: add one entry to `bin/lib/tools-registry.mjs` and run `canon init` in a test
consumer to verify dirs, config file, base-context file, and hook wiring are all correct.
`system-architecture.md` and `system-operations.md` do not need updating for new tool wiring.
