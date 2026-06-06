# System — Tool Integration

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

## Adding a new tool integration

When adding support for a new AI tool:

1. Add a new `## [Tool Name]` section to this file
2. Document: lifecycle events, configuration format, hook output format, known limitations
3. Create hook scripts in `lib/.cursor/hooks/` (or equivalent for the new tool)
4. Add the tool's config file to `manifest.json` wiring if it needs to be written by `sync`
5. Update `bin/commands/init.mjs` to prompt for the new layer and write config
6. Update `system-architecture.md §3` only if a new *script* is added — not for new tool wiring

`system-architecture.md` and `system-operations.md` do not need updating.
