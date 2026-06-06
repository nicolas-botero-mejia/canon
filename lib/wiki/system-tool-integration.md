# System — Tool Integration

**Last updated:** 2026-06-06

**Scope:** How each supported tool consumes the framework — lifecycle events, configuration
format, hook output format, known limitations. Add a new section here when adding a new tool.
The architecture (system-architecture.md) and methodology (system-operations.md) do not change
when a new tool is integrated.

---

## Claude Code

### Lifecycle events
| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| SessionStart | Session opens | No (advisory only) |
| PreToolUse | Before any tool call | Yes — exit 2 blocks |
| PostToolUse | After any tool call | Only via JSON decision (exit 2 alone is non-blocking) |
| Stop | Session ends | Yes — exit 2 blocks close |

### Configuration
`.claude/settings.json` — hooks array under each event name. Written by `canon init`.

### Hook output format
Scripts communicate back to Claude via stdout JSON:
- Advisory: `{ "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." } }`
- Block (PostToolUse only): `{ "decision": "block", "reason": "...", "hookSpecificOutput": {...} }`
- PreToolUse block: exit 2

### Slash command invocation
Skills invoked as `/skill-name` — loaded from `.claude/skills/[name]/SKILL.md`.
Agents invoked as subagents from skills using the Agent tool.

### Known limitations
- PostToolUse: exit 2 alone is non-blocking. Hard blocks require JSON `{ "decision": "block" }` with exit 0.
- PreToolUse: exit 2 blocks. No JSON format needed.
- SessionStart: always advisory — cannot block session open.

---

## Cursor

### Lifecycle events
[To be filled when Cursor integration is implemented]

### Configuration
`.cursor/hooks.json` — written by `canon init` if Cursor layer is enabled.

### Known limitations
[To be filled]

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

### Resources

Resources expose full file content. The AI reads and reasons about them.

| URI pattern | Content |
|-------------|---------|
| `canon://wiki/{layer}/{filename}` | Wiki files (project, client, user, standards) |
| `canon://findings/{filename}` | Findings files |
| `canon://conclusions/{filename}` | Conclusions files |
| `canon://deliverables/{filename}` | Client-facing deliverables |
| `canon://plans/{filename}` | Plan files |
| `canon://CONTENT_INDEX.md` | Full content index |

### Tools

Tools answer structured queries — use these when filtering across many files.

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

When adding support for a new AI tool:

1. Add a new `## [Tool Name]` section to this file
2. Document: lifecycle events, configuration format, hook output format, known limitations
3. Create hook scripts in `lib/.cursor/hooks/` (or equivalent for the new tool)
4. Add the tool's config file to `manifest.json` wiring if it needs to be written by `sync`
5. Update `bin/commands/init.mjs` to prompt for the new layer and write config
6. Update `system-architecture.md §3` only if a new *script* is added — not for new tool wiring

`system-architecture.md` and `system-operations.md` do not need updating.
