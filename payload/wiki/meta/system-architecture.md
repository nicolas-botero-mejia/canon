# Knowledge System Architecture

**Last updated:** 2026-06-03 (governance hardening — Phase vs. Activity skill model; scripts split into meta/ and project/; /activity-new + /activity-conclude + /phase-new + /phase-conclude added; old individual skills retired; post-write-check.sh covers findings/ and output/; check-index.sh path-grep and mtime improvements)
**Scope:** The self-maintaining documentation infrastructure — hooks, scripts, templates, and the file watcher. How it works, what it depends on, and how to verify it.

> For maintenance process (when to update content, naming conventions, what belongs where) → [system-operations.md](./system-operations.md)
> For project-wide content map → [CONTENT_INDEX.md](../../CONTENT_INDEX.md)

---

## 1. Overview

The knowledge system is self-enforcing: sessions cannot close with a stale index or broken links. Out-of-session file changes are detected by a background watcher. Phase transitions and component scaffolding are scripted to eliminate boilerplate. An agent and skill layer orchestrates recurring workflows and enforces knowledge currency.

### §1.1 — Phase vs. Activity Model

The skill layer maps to two distinct levels:

```
Phase lifecycle
  /phase-new  ──────────────────────────────────────  /phase-conclude
                         │                   │
               Activities run here
         (session · poc · research · addendum)
                         │                   │
               /activity-new [type]    /activity-conclude [type]
```

**Phase** = the engagement container (Phase 1, Phase 2). Managed by `/phase-new` + `/phase-conclude`. Operates on the whole engagement.

**Activity** = a bounded unit of work inside a phase. Four types: `session`, `poc`, `research`, `addendum`. All share the same lifecycle — `new → in progress → concluded` — managed by two unified skills. The `session` type of `/activity-conclude` is a checkpoint (results stub + decisions update; no conclusions file written).

---

### §1.2 — Session Lifecycle

```
╔══════════════════════════════════════════════════════════════════════╗
║  BACKGROUND (always running, outside sessions)                       ║
║  scripts/meta/watch-project.sh → .claude/pending-updates.log         ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  SESSION START                                                        ║
║  Hook [auto]: date/time                                              ║
║  Hook [auto]: scripts/meta/session-start-report.sh                   ║
║    → file counts, pending external updates, CLAUDE.md age warning    ║
║  Rules [always-on]: behavioral.md (15 rules) loaded via CLAUDE.md    ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  PRE-WORK SETUP (rule-governed, manually triggered)                  ║
║  Rule 8 + Rule 12: load prior conclusions, run /conclusions-review   ║
║  Skill [manual]: /activity-new [type]                                ║
║    → type: poc | addendum | research | session                       ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  WORK PHASE (POC execution, session content, research)               ║
║  Agents [manually spawned]: librarian, pm, writer                    ║
║  Hook [PostToolUse, auto]: scripts/meta/post-write-check.sh          ║
║    → wiki/ + plans/: blocks on deprecated tool names                 ║
║    → findings/ + output/: warns if file not in CONTENT_INDEX         ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  CLOSE PHASE (manually triggered)                                    ║
║  Skill [manual]: /activity-conclude [type]                           ║
║    → synthesizes findings → conclusions (poc/addendum/research)      ║
║    → creates results stub + updates tracker (session type)           ║
║    /conclusions-review: 4 passes (patch · stub fills · new coverage  ║
║      · forward signals) + CONTENT_INDEX pre-check                    ║
║  Skill [manual]: /wiki-manage (add / update / deprecate / move)      ║
║    → required for all wiki lifecycle changes including content moves  ║
║  Rule 15 [manual]: functional test required for governance changes    ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  SESSION STOP                                                         ║
║  Hook [auto, blocks on exit 2]: scripts/meta/check-index.sh          ║
║    → missing files + ⚠ mtime drift (stale entries)                   ║
║  Hook [auto, blocks on exit 2]: scripts/meta/check-links.sh          ║
║  Hook [auto, blocks on exit 2]: scripts/meta/check-stale-refs.sh     ║
║  Hook [auto, warns]: scripts/meta/check-conclusions-alignment.sh     ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  PERIODIC (manually triggered, not session-bound)                    ║
║  Skill [manual]: /knowledge-audit                                     ║
║    → 14-dimension consistency check across all files                 ║
║  Phase operations (when phase ends / new phase begins):              ║
║    /phase-conclude → /phase-new                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

Agent + skill layer (`.claude/`):
- `agents/librarian.md` — knowledge steward: 8-dimension consistency audit, context surfacing, tmp/ lifecycle
- `agents/writer.md` — document producer: template-driven, prior-context-loaded
- `agents/pm.md` — engagement state: decisions tracker, phase gates
- `skills/[name]/SKILL.md` — **Phase:** `/phase-new`, `/phase-conclude` | **Activity:** `/activity-new`, `/activity-conclude` | **System:** `/wiki-manage`, `/knowledge-audit`, `/conclusions-review`
- `rules/behavioral.md` — 15 behavioral rules (auto-loaded each session)

**Meta-doc currency:** `wiki/meta/system-architecture.md` and `wiki/meta/system-operations.md` must be updated whenever a structural change is made (CLAUDE.md Rule 10). The Librarian agent flags this inline during structural work.

---

### §1.3 — Knowledge Layer Architecture

How the folders relate compositionally — what feeds what, and why content belongs where it does. See `wiki/meta/system-operations.md §4` for the content rules that follow from this diagram.

```
╔═══════════════════════╗       ╔══════════════════════════════════════════════╗
║  External world       ║       ║  wiki/standards/                              ║
║                       ║──────→║  Generalizable knowledge. Stable across       ║
║  Industry research    ║       ║  projects. Does not know about clients.       ║
║  Tool documentation   ║       ╚══════════════════════╦═══════════════════════╝
║  Open-source patterns ║                               ║ informs decisions
╚═══════════════════════╝                               ↓
                               ╔═══════════════════════════════════════════════╗
╔═══════════════════════╗      ║  wiki/project/                                ║
║  raw/                 ║─────→║  Client-specific decisions. Derived from:     ║
║  (client documents,   ║      ║  standards/ + raw/ + findings/ + output/.     ║
║   immutable)          ║  ↗   ║  Institutionalized memory — stable, sessionless║
╚═══════════════════════╝  │   ╚═══════════════════════════════════════════════╝
                           │                    ↑
╔═══════════════════════╗  │    (stable decisions promoted as conclusions land)
║  findings/            ║──┘                    │
║  (team evidence)      ║──────────────────────→│
╚═══════════════════════╝                       │
           ↓                                    │
╔═══════════════════════╗                       │
║  output/conclusions   ║───────────────────────┘
║  (synthesized)        ║────────→  plans/ (closes tracked decisions)
╚═══════════════════════╝

─────────────────────────────────────────────────────────────────────────────
SYSTEM LAYER — stands apart from the knowledge flow; describes the pipeline itself
wiki/meta/ · .claude/ (agents, skills, rules, hooks) · scripts/
─────────────────────────────────────────────────────────────────────────────
TRANSIENT
tmp/ (audits, trackers — lifecycle-limited, not part of the permanent knowledge base)
```

**Reading the diagram:**
- `wiki/project/` is the intersection of three inputs: external industry knowledge (standards/), confirmed project discoveries (output/conclusions), and client context (raw/ → findings/)
- `wiki/standards/` is never derived from project-specific work — it only accepts generalizable knowledge that would be true on any engagement
- Content enters `wiki/project/` only after going through findings/ → output/. Project wiki pages are the stable, sessionless distillation of conclusions — not the synthesis itself.
- The system layer (meta/, .claude/, scripts/) describes the pipeline; it is not part of the knowledge flow.

---

## 2. Hook Configuration

**File:** `.claude/settings.json` (project-level — applies to all machines opening this project)

> **Note:** `check-index.sh` monitors `wiki/`, `findings/`, `plans/`, and `output/`. It does NOT monitor `tmp/` — transient working files are intentionally excluded from index enforcement.

Hooks fire automatically — no manual trigger.

| Event | Hook | Script | Behavior |
|-------|------|--------|----------|
| SessionStart | Fires once at session open | `scripts/meta/session-start-report.sh` | Reports file counts, pending external updates, CLAUDE.md age. Informational — never blocks. |
| SessionStart | Fires once at session open | (inline date command) | Outputs current date/time to session context. Duplicated from global settings so it works without the global file. |
| PostToolUse (Write\|Edit) | Fires after every Write or Edit tool call | `scripts/meta/post-write-check.sh` | Reads JSON from stdin. Extracts `tool_input.file_path`. For wiki/ and plans/ files: runs `check-stale-refs.sh --file`, returns `{"decision":"block"}` if a deprecated pattern is found. For findings/ and output/ files: emits ⚠ warning if file is not yet in CONTENT_INDEX.md (advisory, non-blocking). 30-second timeout. |
| Stop | Fires when Claude finishes a response | `scripts/meta/check-index.sh` | Exits 2 if any .md files in wiki/findings/plans/output/ are missing from CONTENT_INDEX.md (full relative path match). Also emits ⚠ if files are newer than the index (potentially stale entries). |
| Stop | Fires when Claude finishes a response | `scripts/meta/check-links.sh` | Exits 2 if any relative markdown links in wiki/findings/plans/.claude/ are broken. |
| Stop | Fires when Claude finishes a response | `scripts/meta/check-stale-refs.sh` | Exits 2 if deprecated tool/pattern names (from the maintained pattern list in the script) appear in wiki/ or plans/ without a deprecation context word on the same line. |
| Stop | Fires when Claude finishes a response | `scripts/meta/check-conclusions-alignment.sh` | Warns (exit 0) if any Complete conclusions file in output/ is missing a dated **Alignment verified:** field. |

**Exit code behavior:**
- Exit 0 → session closes normally
- Exit 2 → Claude is forced to continue working — cannot finish until checks pass

---

## 3. Scripts Inventory

Scripts are organized in two subdirectories:
- **`scripts/meta/`** — Governance scripts. These check and maintain the system itself. Their lifecycle tracks the framework's methodology.
- **`scripts/project/`** — Project deliverable scripts. **Extension point — empty in the framework template.** Projects add deliverable-automation scripts here (token pipelines, component scaffolding, etc.); these generate project-specific artifacts and are not part of the framework package.

All scripts are executable (`chmod +x`).

### Meta/Governance Scripts (`scripts/meta/`)

### `scripts/meta/check-index.sh`
Scans `wiki/`, `findings/`, `plans/`, `output/` for `.md` files not listed in `CONTENT_INDEX.md`. Excludes `_archive/` subdirs and `README.md` files. Matches using full relative path (e.g., `findings/phase-01-...md`) to prevent false-positives when a filename appears in prose. mtime drift elevated to `⚠` warning level.

**Dependencies:** `find`, `grep`, `basename` — standard POSIX, no external deps.
**Used by:** Stop hook.

### `scripts/meta/check-links.sh`
Scans all `.md` files in `wiki/`, `findings/`, `plans/`, `CONTENT_INDEX.md`, and `.claude/` for relative markdown links (`./` or `../` prefixes). Resolves each path and checks it exists. Ignores fragment-only links.

> **Scope note:** `.claude/` (agents, skills, rules) was added to DIRS on 2026-06-01 to close a blind spot — broken links inside agent/skill/rules files were previously undetected by this check.

**Dependencies:** `python3` for link extraction (avoids BSD/GNU grep compatibility issues).
**Dependency check:** Script self-tests for `python3` and exits with an install message if missing.
**Used by:** Stop hook.

### `scripts/meta/session-start-report.sh`
Counts `.md` files per folder, reads `.claude/pending-updates.log` to surface out-of-session file changes, checks CLAUDE.md modification age. Outputs JSON in `hookSpecificOutput` format for session context injection.

**Dependencies:** `find`, `stat`, `date` — standard. Uses BSD `stat -f` with GNU `stat -c` fallback.
**Used by:** SessionStart hook.

### `scripts/meta/watch-project.sh`
Background `fswatch` process watching `wiki/`, `findings/`, `plans/`, `output/`, `raw/`. Appends timestamped entries to `.claude/pending-updates.log` when `.md` files are added or modified. Excludes `CONTENT_INDEX.md` and the sentinel file from the watch to prevent feedback loops.

**Dependencies:** `fswatch` — external, not installed by default.
**Install:** `brew install fswatch`
**Start:** `bash scripts/meta/watch-project.sh &` (background) or run foreground for debugging.
**Multi-session safety:** Sentinel is append-only. Multiple sessions can read it safely — whoever indexes a file first makes subsequent reads a no-op.

### `scripts/meta/check-stale-refs.sh`
Scans `wiki/` and `plans/` for deprecated tool/pattern names. Checks each line against a maintained pattern list (the `PATTERN` variable in the script — an empty placeholder by default; projects add retired tool/approach names as they accumulate). Skips code blocks, inline code spans, and lines containing deprecation context words (`deprecated`, `removed`, `superseded`, `deferred`, `replaced by`, `⚠`). Also skips `output/` and `findings/` — those directories document history and may intentionally reference deprecated items.

**Modes:** Full scan (no args) for Stop hook; single-file scan (`--file <path>`) for PostToolUse hook.
**Dependencies:** `grep`, `find`, `sed` — standard POSIX.
**Used by:** Stop hook (full scan) and PostToolUse hook via `post-write-check.sh` (file scan).
**Maintenance:** Add new patterns when a tool or approach is officially retired. Add the exact string that would appear in a live wiki reference.
**Blind spot — Draft plans:** The Stop hook full scan covers `wiki/` only — `plans/` is excluded (historical record). Pre-existing stale refs in Draft plans are not proactively detected; they surface only when the plan file is edited (PostToolUse fires on write). To audit all Draft plans manually: `bash scripts/meta/check-stale-refs.sh` does not cover plans/ — use `grep -rn "<pattern>" plans/` directly.

### `scripts/meta/check-conclusions-alignment.sh`
Finds all `output/*.md` files with `**Status:** Complete` and checks each for a dated `**Alignment verified:** YYYY-MM-DD` field. Exits 0 always (warning, not blocking). Prints a named list of unverified files and a reminder to run `/conclusions-review`.

**Dependencies:** `grep`, `find` — standard POSIX.
**Used by:** Stop hook.

### `scripts/meta/post-write-check.sh`
PostToolUse hook wrapper. Reads the tool-use JSON payload from stdin, extracts `file_path` from `tool_input`. For `wiki/` and `plans/` files: calls `check-stale-refs.sh --file` and returns `{"decision":"block"}` if a deprecated pattern is found. For `findings/` and `output/` files: emits ⚠ warning if the file is not yet in CONTENT_INDEX.md (advisory, non-blocking). Requires `python3` for JSON parsing.

**Dependencies:** `python3`, `bash` — standard on macOS.
**Used by:** PostToolUse hook (matcher: `Write|Edit`).

### `scripts/meta/phase-transition.sh`
Archives all `plans/phase-<N>-*.md` files, scaffolds the next phase index from template, updates `CONTENT_INDEX.md` and `CLAUDE.md` pointers, appends to `log.md`. Supports `--dry-run` flag. Called by `/phase-conclude` Step 4 and optionally by `/phase-new` Step 2.

**Dependencies:** `sed`, `find`, `mv`, `mkdir` — standard POSIX.
**Usage:** `bash scripts/meta/phase-transition.sh 01 02` or `bash scripts/meta/phase-transition.sh 01 02 --dry-run`

---

### Project/Deliverable Scripts (`scripts/project/`)

**Extension point — empty in the framework template.** Projects add their own deliverable-automation scripts here — token pipelines, component scaffolding, design-to-code converters, and the like. These generate project-specific artifacts, are documented per project in `wiki/project/`, and are not part of the framework package.

---

## 4. Templates

**Two template systems exist — different purposes, different naming:**

**Script templates** (used by bash scripts, `{{PLACEHOLDER}}` syntax, `sed`-interpolated):

| File | Used by | What it scaffolds |
|------|---------|-------------------|
| `scripts/templates/phase-index-template.md` | `phase-transition.sh` | New phase index with decisions tracker, risk register, session mapping, phase gate |

**Knowledge templates** (used by the Writer agent and team, copy-rename-fill pattern):

Named `[process-type].[file-type]-template.md`. Full map, destination folders, and usage rules → `wiki/meta/templates/template-index.md`.

| Template | Creates | Goes to |
|----------|---------|---------|
| `poc.plan-template.md` | POC session plan | `plans/` |
| `poc.results-template.md` | POC execution log | `findings/` |
| `poc.conclusions-template.md` | POC synthesized output | `output/` |
| `addendum.plan-template.md` | Addendum plan (extends a closed POC) | `plans/` |
| `addendum.results-template.md` | Addendum execution log (new hypotheses only) | `findings/` |
| `addendum.conclusions-template.md` | Addendum verdicts + revised decisions | `output/` |
| `signal.results-template.md` | Signal assessment (no parent doc — routes to action) | `findings/` |
| `research.plan-template.md` | Research plan | `plans/` |
| `research.results-template.md` | Research findings | `findings/` |
| `research.conclusions-template.md` | Research synthesized output (only when closes a decision) | `output/` |
| `session.field-notes-template.md` | Human personal notes | `findings/` |
| `session.results-template.md` | AI-structured session analysis | `findings/` |
| `session.conclusions-template.md` | Session synthesized output | `output/` |
| `handoff.results-template.md` | Transitional context-transfer between phases/POCs | `findings/` |
| `tmp.working-file-template.md` | Transient working files | `tmp/` |

> **Template updates 2026-06-01:** `addendum.plan-template.md` now includes `§Pre-session Prerequisites` (with escalation protocol) and `§Downstream Dependencies` (declares which future POCs/sessions depend on this addendum's outcome). `addendum.conclusions-template.md` now includes `**Alignment verified:**` metadata field (set by `/conclusions-review`) and `§Downstream Impact` (records verdict impact on each downstream item). `poc.plan-template.md` now includes the escalation protocol in its Prerequisites section. `poc.conclusions-template.md` and `session.conclusions-template.md` now include `**Alignment verified:**` field.

---

## 5. Sentinel File

**Path:** `.claude/pending-updates.log`

Append-only log of out-of-session file changes written by `watch-project.sh`. Read by `session-start-report.sh` at session start. Never watched by `watch-project.sh` (excluded to prevent feedback loop).

Format: one entry per line — `YYYY-MM-DDThh:mm:ssZ /absolute/path/to/file.md`

The sentinel is never auto-cleared. Files that get indexed stop appearing in reports because `session-start-report.sh` cross-checks against `CONTENT_INDEX.md`. Old entries become inert once the file is indexed.

---

## 6. Dependency Summary

| Dependency | Required by | How to check | How to install |
|-----------|------------|--------------|----------------|
| `python3` | `check-links.sh`, `post-write-check.sh` | `which python3` | Pre-installed on macOS |
| `fswatch` | `watch-project.sh` | `which fswatch` | `brew install fswatch` |
| `sed`, `find`, `bash` | All scripts | Pre-installed | — |

**Quick setup on a new machine:**
```bash
brew install fswatch
# python3 is pre-installed on macOS; verify with: which python3
```

---

## 7. Verifying the System

Run all checks manually to confirm the system is healthy:

```bash
# Index check (should exit 0)
bash scripts/meta/check-index.sh && echo "✓ Index clean"

# Link check (should exit 0)
bash scripts/meta/check-links.sh && echo "✓ Links clean"

# Stale ref check (should exit 0)
bash scripts/meta/check-stale-refs.sh && echo "✓ No stale refs"

# Alignment check (should warn if any conclusions unverified)
bash scripts/meta/check-conclusions-alignment.sh

# Start report (should output JSON with project state)
bash scripts/meta/session-start-report.sh

# Watcher (should start watching, or error with install instructions)
bash scripts/meta/watch-project.sh
```

### Content vs. Functional Verification

When a skill, agent, or hook is added or modified, two levels of verification are required (Rule 15):

```
Content check   → Confirm the text of the change is correct. The right words are present,
                  structure matches the file's conventions, links resolve.
                  Caught by: check-links.sh, check-stale-refs.sh, and manual inspection.

Functional test → Invoke the changed mechanism against a controlled case. Observe actual
                  output. A new dimension must fire on a known-bad file and stay silent on
                  a clean file. A new sub-command must produce the correct action and log
                  entry. A new hook must block on violation and pass on clean state.
                  Caught by: running the skill/hook/agent in the session before closing.
```

**Rule:** Never close a session that adds or modifies governance mechanisms without running both levels. See `behavioral.md Rule 15` and `wiki/meta/system-operations.md §14`.

---

## 8. Cloud / GitHub Migration Path

When the project moves to a GitHub repository, the scripts stay unchanged. Only the invocation changes:

| Current | GitHub equivalent |
|---------|------------------|
| Stop hook → `scripts/meta/check-index.sh` | Pre-commit hook or CI step on push |
| Stop hook → `scripts/meta/check-links.sh` | Same CI step |
| `scripts/meta/watch-project.sh` | Replaced by a GitHub Actions trigger on any `.md` push to monitored paths |
| `scripts/meta/phase-transition.sh` | Called manually or as a workflow dispatch action |
| `scripts/project/*` (project deliverable scripts) | Called manually or as a workflow dispatch action |

No documentation architecture changes needed at migration time.
