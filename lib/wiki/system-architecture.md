# Knowledge System Architecture

**Last updated:** 2026-06-06
**Scope:** The self-maintaining documentation infrastructure — hooks, scripts, templates, and the file watcher. How it works, what it depends on, and how to verify it.

> For maintenance process (when to update content, naming conventions, what belongs where) → [system-operations.md](./system-operations.md)
> For project-wide content map → [CONTENT_INDEX.md](../../CONTENT_INDEX.md)

---

## 1. Overview

The knowledge system is self-checking: a stale index or broken links are flagged at session close by the advisory Stop hook and by `canon doctor --deep` (ADR-013 — surfaced, never blocking). Out-of-session file changes are detected by a background watcher. Phase transitions and component scaffolding are scripted to eliminate boilerplate. An agent and skill layer orchestrates recurring workflows and enforces knowledge currency.

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

**Full operations per level:**

| Operation | Phase skill | Activity skill | Constraint |
|-----------|------------|----------------|------------|
| Create | `/phase-new` | `/activity-new [type]` | — |
| Update | `/phase-update` | `/activity-update` | Not concluded |
| Deprecate | `/phase-deprecate` | `/activity-deprecate` | Not concluded; no closed decisions |
| Migrate | — | `/activity-migrate` | Planned activities only |
| Reorder | `/phase-reorder` | — | Neither phase concluded or archived |
| Conclude | `/phase-conclude` | `/activity-conclude [type]` | — |

---

### §1.2 — Session Lifecycle

```
╔══════════════════════════════════════════════════════════════════════╗
║  BACKGROUND (always running, outside sessions)                       ║
║  scripts/watch-project.sh → .claude/pending-updates.log         ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  SESSION START                                                        ║
║  Hook [auto]: date/time                                              ║
║  Hook [auto]: scripts/session-start-report.sh                   ║
║    → file counts, pending external updates, CLAUDE.md age warning    ║
║  Rules [always-on]: behavioral.md (19 rules) loaded via CLAUDE.md    ║
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
║  Hook [PostToolUse, auto]: scripts/post-write-check.sh          ║
║    → wiki/ + plans/: blocks on deprecated tool names                 ║
║    → findings/ + conclusions/: warns if file not in CONTENT_INDEX         ║
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
║  Hook [auto, advisory — never blocks]: scripts/check-index.sh   ║
║    → missing files + ⚠ mtime drift (stale entries)                   ║
║  Hook [auto, advisory — never blocks]: scripts/check-links.sh   ║
║  Hook [auto, advisory — never blocks]: scripts/check-stale-refs.sh║
║  Hook [auto, advisory — never blocks]: scripts/check-conclusions-alignment.sh║
║  Hook [auto, advisory — never blocks]: scripts/check-contracts.sh║
║    → structural contract validation (frontmatter, tracker cols,       ║
║      roadmap emoji set, findings/conclusions required fields)         ║
║  Hook [auto, advisory — never blocks]: scripts/check-addendum-integrity.sh║
║    → standalone addendum files (✗) + unverified ## Addendum NN (⚠)    ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║  PERIODIC (manually triggered, not session-bound)                    ║
║  Skill [manual]: /knowledge-audit                                     ║
║    → 15-dimension consistency check across all files                 ║
║  Phase operations (when phase ends / new phase begins):              ║
║    /phase-conclude → /phase-new                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

Agent + skill layer (`.claude/`):
- `agents/librarian.md` — knowledge steward: 8-dimension consistency audit, context surfacing, tmp/ lifecycle
- `agents/writer.md` — document producer: template-driven, prior-context-loaded
- `agents/pm.md` — engagement state: decisions tracker, phase gates
- `skills/[name]/SKILL.md` — **Phase:** `/phase-new`, `/phase-update`, `/phase-deprecate`, `/phase-reorder`, `/phase-conclude` | **Activity:** `/activity-new`, `/activity-update`, `/activity-deprecate`, `/activity-migrate`, `/activity-conclude` | **System:** `/wiki-manage`, `/knowledge-audit`, `/conclusions-review`, `/signal`
- `rules/behavioral.md` — 19 behavioral rules (auto-loaded each session)

**Meta-doc currency:** `system-architecture.md` and `system-operations.md` must be updated whenever a structural change is made (CLAUDE.md Rule 10). The Librarian agent flags this inline during structural work. Design decisions → `system-decisions.md`.

---

### §1.3 — Knowledge Layer Model

The folder structure maps to five conceptual layers. Each layer has a distinct role and a
distinct immutability contract:

**Input** (`raw/`) — What you receive. Authored by others, arrived from outside.
Immutable — never edited, never generated, never synthesized. Transcripts, client documents,
third-party source material. The "raw" name is intentional: it signals the no-touch contract.

**Process** (`plans/` · `findings/` · `conclusions/`) — What you do.
Three folders, not one, because they have different lifecycles and different roles in the pipeline:

| Folder | Content | Lifecycle | Direction |
|--------|---------|-----------|-----------|
| `plans/` | Session guides, decisions tracker, roadmaps | Living — edited continuously | Prospective (what will happen) |
| `findings/` | Field notes, results files, signals, handoffs | Append-only — created during activity, not edited after | Retrospective (what was observed) |
| `conclusions/` | Synthesized verdicts, decisions closed, wiki triggers | Immutable after synthesis | Retrospective (what it means) |

The folders enforce the pipeline direction: `plans/` precedes work, `findings/` captures work,
`conclusions/` synthesizes work. Collapsing them would remove structural enforcement — the
scripts (check-conclusions-alignment, session-start-report) and skills (/activity-conclude,
/conclusions-review) use folder location as a pipeline stage signal, not just the filename suffix.

**Knowledge** (`wiki/`) — What compounds.
Stable reference that persists and grows across the engagement. Sourced from `conclusions/` (and
from `raw/` for wiki/client/, wiki/user/, wiki/standards/ — with human approval).
Not raw, not findings, not output — the layer that makes each session more productive than the last.

Four sub-layers within `wiki/`:

| Sub-layer | What it holds |
|-----------|--------------|
| `wiki/project/` | Client-specific decisions — what was chosen and why |
| `wiki/standards/` | Industry patterns true of any engagement |
| `wiki/client/` | Org knowledge — who the client is, how they operate |
| `wiki/user/` | End-user research synthesized across the engagement |

**Output** (`deliverables/`) — What the client receives.
Packaged formal artifacts derived from conclusions. Different audience, different polish, different
confidentiality than conclusions. Not part of the knowledge synthesis chain — a presentation
created from conclusions stays in `deliverables/` and does not feed wiki.

**Transient** (`tmp/`) — What gets cleaned up.
Lifecycle-limited working files. Each has a `**Closes when:**` condition. Not indexed, not linked,
not permanent knowledge. Cleaned when the condition is met.

For intellectual lineage (how this maps to Karpathy's model and ResearchOps patterns) →
`system-operations.md §3`. For content rules (what belongs in each folder) → `system-operations.md §4`.

---

## 2. Hook Configuration

The framework uses lifecycle hooks to enforce consistency automatically. Hooks fire at key
session events and dispatch to the governance scripts in `lib/scripts/`. The dispatch
mechanism is tool-specific — see `system-tool-integration.md` for how each tool wires hooks.

The three canonical lifecycle events the framework requires:
- **Session open** — surface project state (`session-start-report.sh`)
- **After write/edit** — stale-ref check on wiki/plans, CONTENT_INDEX advisory (`post-write-check.sh`)
- **Session close** — six-script consistency chain (check-index → check-links → check-stale-refs → check-conclusions-alignment → check-contracts → check-addendum-integrity)

The hook dispatcher (`bin/hook.sh`) receives the event name and routes to the correct script.
Tool-specific configuration (event names, JSON format, exit code behavior) → `system-tool-integration.md`.

---

## 3. Scripts Inventory

Scripts are organized in two locations:
- **`scripts/`** (in the framework package at `node_modules/.../lib/scripts/`) — Governance scripts. These check and maintain the system itself. Their lifecycle tracks the framework's methodology. Invoked via the hook dispatcher (`bin/hook.sh`).
- **`scripts/project/`** (in the consumer project) — Project deliverable scripts. **Extension point — empty in the framework template.** Projects add deliverable-automation scripts here (token pipelines, component scaffolding, etc.); these generate project-specific artifacts and are not part of the framework package.

All scripts are executable (`chmod +x`).

### Governance Scripts (`scripts/`)

### `scripts/check-index.sh`
Scans `wiki/`, `findings/`, `plans/`, `conclusions/` for `.md` files not listed in `CONTENT_INDEX.md`. Excludes `_archive/` subdirs and `README.md` files. Matches using full relative path (e.g., `findings/phase-01-...md`) to prevent false-positives when a filename appears in prose. mtime drift elevated to `⚠` warning level.

**Dependencies:** `find`, `grep`, `basename` — standard POSIX, no external deps.
**Used by:** Stop hook.

### `scripts/check-links.sh`
Scans all `.md` files in `wiki/`, `findings/`, `plans/`, `CONTENT_INDEX.md`, and `.claude/` for relative markdown links (`./` or `../` prefixes). Resolves each path and checks it exists. Ignores fragment-only links.

> **Scope note:** `.claude/` (agents, skills, rules) was added to DIRS on 2026-06-01 to close a blind spot — broken links inside agent/skill/rules files were previously undetected by this check.

**Dependencies:** `python3` for link extraction (avoids BSD/GNU grep compatibility issues).
**Dependency check:** Script self-tests for `python3` and exits with an install message if missing.
**Used by:** Stop hook.

### `scripts/session-start-report.sh`
Counts `.md` files per folder, reads `.claude/pending-updates.log` to surface out-of-session file changes, checks CLAUDE.md modification age. Outputs JSON in `hookSpecificOutput` format for session context injection.

**Dependencies:** `find`, `stat`, `date` — standard. Uses BSD `stat -f` with GNU `stat -c` fallback.
**Used by:** SessionStart hook.

### `scripts/watch-project.sh`
Background `fswatch` process watching `wiki/`, `findings/`, `plans/`, `conclusions/`, `raw/`. Appends timestamped entries to `.claude/pending-updates.log` when `.md` files are added or modified. Excludes `CONTENT_INDEX.md` and the sentinel file from the watch to prevent feedback loops.

**Dependencies:** `fswatch` — external, not installed by default.
**Install:** `brew install fswatch`
**Start:** `bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/watch-project.sh &` (background) or run foreground for debugging.
**Multi-session safety:** Sentinel is append-only. Multiple sessions can read it safely — whoever indexes a file first makes subsequent reads a no-op.

### `scripts/check-stale-refs.sh`
Scans `wiki/` and `plans/` for deprecated tool/pattern names. Checks each line against a maintained pattern list (the `PATTERN` variable in the script — an empty placeholder by default; projects add retired tool/approach names as they accumulate). Skips code blocks, inline code spans, and lines containing deprecation context words (`deprecated`, `removed`, `superseded`, `deferred`, `replaced by`, `⚠`). Also skips `conclusions/` and `findings/` — those directories document history and may intentionally reference deprecated items.

**Modes:** Full scan (no args) for Stop hook; single-file scan (`--file <path>`) for PostToolUse hook.
**Dependencies:** `grep`, `find`, `sed` — standard POSIX.
**Used by:** Stop hook (full scan) and PostToolUse hook via `post-write-check.sh` (file scan).
**Maintenance:** Add new patterns when a tool or approach is officially retired. Add the exact string that would appear in a live wiki reference.
**Blind spot — Draft plans:** The Stop hook full scan covers `wiki/` only — `plans/` is excluded (historical record). Pre-existing stale refs in Draft plans are not proactively detected; they surface only when the plan file is edited (PostToolUse fires on write). To audit all Draft plans manually: `bash scripts/check-stale-refs.sh` does not cover plans/ — use `grep -rn "<pattern>" plans/` directly.

### `scripts/check-conclusions-alignment.sh`
Finds all `conclusions/*.md` files with `**Status:** Complete` and checks each for a dated `**Alignment verified:** YYYY-MM-DD` field. Exits 0 always (warning, not blocking). Prints a named list of unverified files and a reminder to run `/conclusions-review`.

**Dependencies:** `grep`, `find` — standard POSIX.
**Used by:** Stop hook.

### `scripts/check-contracts.sh`
Validates structural contracts on four file types — required for MCP query reliability. Runs at session close (Stop hook chain) as a warning, not a hard block.

**What it validates:**
- `CONTENT_INDEX.md` entries: per-entry two-form check — full four-part block (`###` heading + all three markers) or lightweight one-liner (0 markers); 1–2 of 3 markers = broken entry; file entries demoted below `###` are flagged
- `plans/phase-NN-index.md §Decisions Tracker`: all four columns present (`ID`, `Description`, `Status`, `Closed`)
- `plans/phase-NN-poc-roadmap.md`: status values are from the allowed set — core emojis (🔜 ⏳ 🔄 ✅ ⏭️) plus terminal text statuses (`Deprecated`, `~~In Progress~~ Deprecated`, `Migrated → Phase NN`)
- `findings/*.md`: `**Author:**` and `**Date:**` present in first 10 lines
- `conclusions/*.md`: `**Author:**`, `**Date:**`/`**Synthesis date:**`, and `**Alignment verified:**` present in first 10 lines
- `wiki/client/` + `wiki/user/` `.md` files: no YAML frontmatter (ADR-012 — these layers are read whole by MCP)

**Dependencies:** `grep`, `find`, `head` — standard POSIX.
**Used by:** Stop hook (after `check-conclusions-alignment.sh`).

### `scripts/check-addendum-integrity.sh`
Validates the in-file addendum model (ADR-010, Dim 10–11). **FAIL (exit 1):** a standalone `*addendum*-conclusions.md` file in `conclusions/` — addenda must be appended as `## Addendum NN` sections in the parent POC conclusions file, never standalone files. **WARN (exit 0, ⚠):** a `## Addendum NN` section missing a dated `**Addendum alignment verified:**`. Cross-file checks (a roadmap addendum marked ✅ Complete with no parent section) are intentionally left to `/knowledge-audit` Dim 10 — bash checks stay local/mechanical.

**Dependencies:** `grep`, `find`, `awk` — standard POSIX.
**Used by:** Stop hook (after `check-contracts.sh`) and `canon doctor --deep`.

### `scripts/post-write-check.sh`
PostToolUse hook wrapper. Reads the tool-use JSON payload from stdin, extracts `file_path` from `tool_input`. For `wiki/` and `plans/` files: calls `check-stale-refs.sh --file` and returns `{"decision":"block"}` if a deprecated pattern is found. For `findings/` and `conclusions/` files: emits ⚠ warning if the file is not yet in CONTENT_INDEX.md (advisory, non-blocking). Requires `python3` for JSON parsing.

**Dependencies:** `python3`, `bash` — standard on macOS.
**Used by:** PostToolUse hook (matcher: `Write|Edit`).

### `scripts/phase-transition.sh`
Archives all `plans/phase-<N>-*.md` files, scaffolds the next phase index from template, updates `CONTENT_INDEX.md` and `CLAUDE.md` pointers, appends to `log.md`. Supports `--dry-run` flag. Called by `/phase-conclude` Step 4 and optionally by `/phase-new` Step 2.

**Dependencies:** `sed`, `find`, `mv`, `mkdir` — standard POSIX.
**Usage:** `bash scripts/phase-transition.sh 01 02` or `bash scripts/phase-transition.sh 01 02 --dry-run`

### `scripts/phase-reorder.sh`
Swaps the numbers of two active phases using a three-step atomic rename (A→TMP, B→A, TMP→B) to avoid collisions. Updates internal file references, `CONTENT_INDEX.md` section headers, `CLAUDE.md` phase references, and appends a `reorder` log entry. Supports `--dry-run` flag. Blocks if either phase has a summary file or archive directory. Called by `/phase-reorder` Step 2 after human approves the dry-run rename plan.

**Dependencies:** `sed`, `find`, `mv`, `grep` — standard POSIX.
**Modes:** `--dry-run` (print rename plan, no changes) or execute.
**Usage:** `bash scripts/phase-reorder.sh 02 04` or `bash scripts/phase-reorder.sh 02 04 --dry-run`
**Scope:** `plans/`, `findings/`, `conclusions/` only — `plans/_archive/` is read-only.

---

### Project/Deliverable Scripts (`scripts/project/` — consumer project)

**Extension point — empty in the framework template.** Projects add their own deliverable-automation scripts here — token pipelines, component scaffolding, design-to-code converters, and the like. These generate project-specific artifacts, are documented per project in `wiki/project/`, and are not part of the framework package.

---

## 4. Templates

All templates live in **`lib/templates/`** (in the framework package at `node_modules/.../lib/templates/`). Full map, destination folders, and usage rules → `template-index.md` in that directory. Template philosophy and naming conventions → `system-template-standards.md`.

**Two template categories — different purposes, same location:**

**Script templates** (used by bash scripts, `{{PLACEHOLDER}}` syntax, `sed`-interpolated):

| File | Used by | What it scaffolds |
|------|---------|-------------------|
| `phase-index-template.md` | `scripts/phase-transition.sh` | New phase index with decisions tracker, risk register, session mapping, phase gate |

**Knowledge templates** (used by the Writer agent and team, copy-rename-fill pattern):

Named `[process-type].[file-type]-template.md`. Full map → `templates/template-index.md`.

| Template | Creates | Goes to |
|----------|---------|---------|
| `poc.plan-template.md` | POC session plan | `plans/` |
| `poc.results-template.md` | POC execution log | `findings/` |
| `poc.conclusions-template.md` | POC synthesized output | `conclusions/` |
| `addendum.plan-template.md` | Addendum plan (extends a closed POC) | `plans/` |
| `addendum.results-template.md` | Addendum execution log (new hypotheses only) | `findings/` |
| `addendum.conclusions-section-template.md` | Addendum verdicts + revised decisions (appended section) | parent POC `conclusions/` file `§Addendum NN` |
| `signal.results-template.md` | Signal assessment (no parent doc — routes to action) | `findings/` |
| `research.plan-template.md` | Research plan | `plans/` |
| `research.results-template.md` | Research findings | `findings/` |
| `research.conclusions-template.md` | Research synthesized output (only when closes a decision) | `conclusions/` |
| `session.field-notes-template.md` | Human personal notes | `findings/` |
| `session.results-template.md` | AI-structured session analysis | `findings/` |
| `session.conclusions-template.md` | Session synthesized output | `conclusions/` |
| `handoff.results-template.md` | Transitional context-transfer between phases/POCs | `findings/` |
| `tmp.working-file-template.md` | Transient working files | `tmp/` |

> **Template updates 2026-06-01:** `addendum.plan-template.md` now includes `§Pre-session Prerequisites` (with escalation protocol) and `§Downstream Dependencies` (declares which future POCs/sessions depend on this addendum's outcome). `poc.plan-template.md` now includes the escalation protocol in its Prerequisites section. `poc.conclusions-template.md` and `session.conclusions-template.md` now include `**Alignment verified:**` field. **2026-06-06:** `addendum.conclusions-template.md` renamed to `addendum.conclusions-section-template.md` — addendum conclusions are now appended as `## Addendum NN` sections into the parent POC conclusions file (ADR-010).

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
bash scripts/check-index.sh && echo "✓ Index clean"

# Link check (should exit 0)
bash scripts/check-links.sh && echo "✓ Links clean"

# Stale ref check (should exit 0)
bash scripts/check-stale-refs.sh && echo "✓ No stale refs"

# Alignment check (should warn if any conclusions unverified)
bash scripts/check-conclusions-alignment.sh

# Start report (should output JSON with project state)
bash scripts/session-start-report.sh

# Watcher (should start watching, or error with install instructions)
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/watch-project.sh
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

**Rule:** Never close a session that adds or modifies governance mechanisms without running both levels. See `behavioral.md Rule 15` and `system-operations.md §14`.

---

## 9. Parsing Contracts

Structural guarantees for template-generated files. Required for MCP query reliability (`check-contracts.sh` enforces these at session close).

### `plans/phase-NN-index.md §Decisions Tracker`

- **Required columns:** `ID` | `Description` | `Status` | `Closed / Deferred` (date + source)
- **Status values:** `Open` | `Closed — [answer] — [source], YYYY-MM-DD` | `Deferred — [reason] — [trigger]`
- **Contract:** every row has all four columns; ID column starts with `D-`

### `plans/phase-NN-poc-roadmap.md`

- **Required columns:** `POC #` | `Name` | `Status` | `Prerequisite` | `Sessions` | `Decisions it closes`
- **Status values:** `🔜 Planned` | `⏳ In Progress` | `✅ Complete` | `Deprecated` | `~~In Progress~~ Deprecated` | `Migrated → Phase NN`
- **Contract:** consistent emoji status values across all roadmap files; 6 columns in every data row

### `CONTENT_INDEX.md` entries

- **Required format:** `### [filename](./path/to/file)` followed by either: (a) full four-part block — `**What it is:**`, `**Key facts:**`, `**Questions it answers:**`; or (b) lightweight single-line description (0 markers — valid for mechanism files: agents, skills, templates, scripts)
- **Contract:** entries with 1–2 of 3 markers are invalid (partial/broken block); entries demoted below `###` level are an error; entries with 0 or 3/3 markers are valid. Validated per-entry, not by global count.

### `findings/*.md`

- **Required header fields (first 10 lines):** `**Author:**`, `**Date:**`, `**Status:**`
- **YAML frontmatter:** `type`, `phase`, `topic`, `status`, `author`, `date` (see `system-template-standards.md`)
- **Contract:** these fields appear in the first 10 lines of every file

### `conclusions/*.conclusions.md`

- **Required header fields (first 10 lines):** `**Author:**`, `**Date:**` or `**Synthesis date:**`, `**Status:**`, `**Alignment verified:**`
- **YAML frontmatter:** `type`, `phase`, `topic`, `status`, `alignment_verified`
- **Contract:** `**Alignment verified:**` must be present somewhere in the file; left empty (``) until verified

These contracts are validated by `lib/scripts/check-contracts.sh` (runs in the Stop hook chain after every session).

---

## 8. Cloud / GitHub Migration Path

### Multi-repo workflow

The consumer project and framework package are separate repositories. The framework lives in `node_modules/` — updated via `npm update` + `canon sync`. User content (`plans/`, `findings/`, `conclusions/`, `raw/`, `wiki/project/`, etc.) lives in the consumer repo and is never written by framework tooling. This boundary is enforced by `manifest.json` and checked by `canon doctor`.

### Script migration — local to CI

When moving to CI, the governance scripts stay unchanged. Only the invocation changes:

| Current (local) | CI equivalent |
|----------------|--------------|
| Stop hook → `scripts/check-index.sh` | CI step on push to `wiki/` or `plans/` |
| Stop hook → `scripts/check-links.sh` | Same CI step |
| Stop hook → `scripts/check-stale-refs.sh` | Same CI step |
| `scripts/watch-project.sh` | GitHub Actions trigger on any `.md` push to monitored paths |
| `scripts/phase-transition.sh` | Called manually or as a workflow dispatch action |
| `scripts/project/*` | Called manually or as a workflow dispatch action |

Recommended CI trigger: push to `wiki/` or `plans/`. The `check-conclusions-alignment.sh` check can stay local (advisory only — exit 0).

### Branching

- `main` is always publishable (consumer) or publishable to npm (package repo).
- Feature branches for structural changes (new folder layout, naming convention changes).
- Package repo: tag `v0.1.x` on publish; never push directly to `main` without a passing test run.

### CD pipeline (package repo)

`npm publish` is triggered manually after the full test suite passes. No automatic publish on push. The publish step:
1. `npm run test:all` — runs unit tests (node --test), integration test (pack → install → init → sync → doctor), and hook dispatcher tests
2. `npm version patch|minor|major` — bumps version, creates git tag
3. `npm publish` — publishes to npm registry

**Test suite structure:**
```
npm test              → test/unit/**/*.test.mjs  (node --test)
                        ├─ invariants.test.mjs  — agreement across hand-listed locations (registry rows)
                        └─ scanners.test.mjs    — whole-repo forbidden-value scan + self-enumerating
                                                  skill/template coverage (completeness by construction)
npm run test:integration → test/integration/update-safety.sh
npm run test:hooks    → test/hooks/run.sh (hook routing + script existence)
npm run test:all      → all three in sequence
```

### Consumer `.gitignore` for CI

```
tmp/                  # never commit transient working files
node_modules/
.framework-version    # DO commit — version pinning contract between init and doctor
```

`raw/` may be gitignored for client confidentiality. If gitignored, CI checks that scan `raw/` will silently pass (no files to scan). Document this if the project uses CI link-checking.
