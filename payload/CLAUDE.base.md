# [Project Name] — Project Context

> This file is read by Claude at the start of every session. Keep it concise. Point to other files for depth — don't duplicate content here. Target: under 200 lines.

---

## What This Project Is

**Client:** [client]
**Provider:** [provider]
**Engagement:** [what you are designing / delivering]
**Scope:** [scope summary — size, duration, phases]
**Starting surface:** [primary platform / system this work begins on]
**Status:** [current status — e.g. Discovery in progress]

---

## Folder Structure

```
wiki/               → Reference documentation. Stable. Start here.
  (index moved to CONTENT_INDEX.md at project root)
  standards/        → Industry-wide reference (domain, brand, accessibility)
  project/          → Client-specific reference (tech stack — living, updates as decisions close)
  meta/             → Methodology (framework docs — lives in node_modules, referenced via import)

plans/              → Engagement planning. Client-specific, living documents.
  phase-NN-index.md                   → Phase overview, decisions tracker, session mapping
  phase-NN-pre-discovery.md           → Internal prep before client sessions begin
  phase-NN-session-NN-[name]-plan.md  → Individual session guides
  phase-NN-poc-NN-[name]-plan.md      → POC plans
  phase-NN-poc-roadmap.md             → POC sequencing and status
  _archive/                           → Superseded plans (do not edit)

findings/           → Team-generated observations. Authored by us, pre-synthesis.
                      Session notes, research analysis, audit results.
                      Naming: phase-NN-[process-type]-[identifier]-[file-type].md
                      File types: -field-notes.md, -results.md, -handoff.md

raw/                → Source materials received. Immutable. Do not edit.
                      Client docs, transcripts, manager briefs.

output/             → Synthesized conclusions and formal deliverables.
                      Session conclusions, phase synthesis, component specs.

tmp/                → Transient working files (auto-cleaned). Never commit.
scripts/
  meta/             → Governance scripts (hooks, checks). Framework — lives in node_modules.
  project/          → Deliverable-automation scripts. Per-project extension point.
.claude/
  agents/           → Subagent definitions. Framework — vendored from node_modules on sync.
  skills/           → Skill definitions ([name]/SKILL.md). Framework — vendored on sync.
  rules/            → Behavioral rules (Claude — auto-loaded each session). Framework.
  settings.json     → Claude hook configuration. Wiring — delegates to package dispatcher.
.cursor/
  rules/            → Behavioral rules (Cursor — alwaysApply). Framework — vendored on sync.
  hooks.json        → Cursor hook configuration. Wiring — delegates to package dispatcher.
  hooks/            → Cursor hook scripts. Framework — vendored on sync.

log.md              → Append-only project ledger. Every significant change logged here.
```

---

## How to Navigate

**Step 1:** Read `CONTENT_INDEX.md` — one-line summaries, key facts, questions each file answers.
**Step 2:** Go to the specific wiki file only if you need depth.
**Step 3:** For the active engagement → `plans/phase-NN-index.md` (facts, gaps, risks, decisions).
**Step 4:** For individual session guides → `plans/phase-NN-session-NN-[name]-plan.md`.
**Step 5:** For tech stack details → `wiki/project/tech-stack.md`.

Do not re-read `raw/` or `output/` source docs unless something specific needs verification.

---

## Confirmed Client Facts

| Item | Confirmed Value |
|------|----------------|
| [fact] | [value] |

> Open decisions (scope, libraries, accessibility level, etc.) → `plans/phase-NN-index.md §Decisions Tracker`

---

## Phase Sessions

| # | Session | Date | Time | Type |
|---|---------|------|------|------|
| 1 | [name] | [date] | [time] | Client / Internal |

All files in `plans/`. Full decisions tracker → `plans/phase-NN-index.md §Decisions Tracker`.

---

## How to Keep This File Clean

**Hard limit:** Under 200 lines. If it grows past that, audit and prune before adding anything new.

**Only update CLAUDE.md when:**
- A confirmed fact changes (session closed a decision, stack confirmed, date shifted)
- The active phase changes (Phase 1 → Phase 2)

**Never add to CLAUDE.md:**
- TBDs or open decisions → belong in `plans/phase-NN-index.md §Decisions Tracker`
- Decision summaries or phase-blocking lists → belong in `plans/`
- Research findings, session detail, or explanations → belong in `wiki/` or `findings/`
- Maintenance rules or methodology → live in the framework package (node_modules)
- Behavioral rules → `.claude/rules/behavioral.md` (Claude) · `.cursor/rules/behavioral.mdc` (Cursor)
