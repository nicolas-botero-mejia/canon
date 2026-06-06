# Content Index — Framework

**Pattern:** Karpathy LLM Wiki — content-oriented catalog. Read this first. Go to a full file only when the index points you there.

> This file is the project-wide content map. It is enforced — sessions cannot close with unlisted files. Update entries immediately when files are created or moved.
>
> **How to use:** Find which file answers your question here. Don't open full files unless the index sends you. This keeps the context window lean.
>
> **Framework template.** Only the framework layer is indexed below. The project layer (`standards/`, `project/`, `plans/`, `findings/`, `output/`, `raw/`) ships empty — add entries here as you populate those folders.

---

## meta/ — Methodology & System Maintenance

How we work and how we maintain this knowledge system.

---

### system-principles.md (framework wiki — node_modules/.../lib/wiki/)
**What it is:** Prompting best practices and AI workflow methodology — based on Karpathy's analysis of LLM failure modes, extended to design and research work.

**Key facts:**
- **Four failure patterns:** Silent assumptions, overcomplicated output, collateral damage, no success criteria
- **Four behavioral principles:** Think before acting, simplicity first, surgical changes, goal-driven execution
- **Declarative vs. imperative:** 67% improvement in task success rate; 43.5% reduction in interaction steps
- **Prompt template:** [Context] + [Goal: what done looks like] + [Constraints] + [Format]
- **Warnings:** Atrophy (over-delegating thinking, not just typing); Slopacolypse (comprehensive-looking output that answers no novel questions)

**Questions it answers:**
- What failure modes should I watch for in AI-generated output?
- How do I write a declarative prompt instead of an imperative one?
- What is the Karpathy LLM Wiki pattern and how does this project implement it?
- When should I include success criteria and when can I skip them?

---

### system-operations.md (framework wiki — node_modules/.../lib/wiki/)
**What it is:** Maintenance guide for CLAUDE.md and the entire knowledge system — folder structure rationale, what belongs where, naming conventions, update triggers, and pruning.

**Key facts:**
- **Three-layer knowledge model:** raw/ (received, immutable) → findings/ (team-generated, pre-synthesis) → output/ (synthesized conclusions + deliverables)
- **CLAUDE.md target:** Under 200 lines; no research content; behavioral rules at principle level only
- **Prefix naming convention:** Phase prefix on all findings/, output/, and plans/ files
- **Wiki subdirectories:** standards/ (industry) | project/ (client-specific, living) | meta/ (methodology)
- **Update triggers:** Confirmed facts → CLAUDE.md; research → wiki; session outcomes → findings; conclusions → output
- **6-month test:** Could someone use this file in 6 months, without being in the project, to answer a real question?
- **Active skills:** `/phase-new` + `/phase-conclude` (phase layer) | `/activity-new [type]` + `/activity-conclude [type]` (activity layer) | `/wiki-manage`, `/knowledge-audit`, `/conclusions-review` (system)

**Questions it answers:**
- What belongs in CLAUDE.md vs. wiki vs. plans vs. findings vs. output?
- When and how do I update CLAUDE.md after a session?
- What is the naming convention for findings and output files?
- How does our structure compare to Karpathy's LLM Wiki pattern?
- When should I create a new plan version vs. updating the existing one?

---

### template-index.md (framework templates — node_modules/.../lib/templates/)
**What it is:** Template map and index for all project templates. Naming convention: `[process-type].[file-type]-template.md`. Full template listing in the Templates section below.

**Mandatory sections in every POC session plan:** Prerequisites (with roadmap link), Context, Validation table, Hypotheses table, External Validation step (second-to-last), Conclusion Synthesis + Wiki Update step (last), Success Criteria, POC Roadmap Position.

**Mandatory sections in every POC conclusions file:** Per-hypothesis blocks (status / finding / decision / wiki update), Decisions Closed table, Wiki Files Updated table, Addendum Candidates table (forward signals for /conclusions-review pass 4).

---

### system-architecture.md (framework wiki — node_modules/.../lib/wiki/)
**What it is:** Technical reference for the self-maintaining knowledge system — Phase vs. Activity skill model, session lifecycle, knowledge layer relationships, hooks, scripts (meta/ vs. project/), templates, file watcher, dependency requirements, and verification.

**Key facts:**
- **Phase vs. Activity model (§1.1):** Two skill layers — `/phase-new` + `/phase-conclude` manage the engagement container; `/activity-new [type]` + `/activity-conclude [type]` manage work inside phases (poc | addendum | research | session)
- **§1.2 Session lifecycle diagram**: BACKGROUND → SESSION START → PRE-WORK SETUP → WORK PHASE → CLOSE → SESSION STOP → PERIODIC
- **§1.3 Knowledge layer diagram**: raw/ → findings/ → output/ feeds wiki/project/; standards/ from external knowledge; node_modules/.../lib/wiki/ + .claude/ are the system layer
- **Scripts split:** `node_modules/@nicolas-botero-mejia/canon/lib/scripts/` (8 governance scripts) | `scripts/project/` (empty extension point — projects add deliverable scripts)
- Stop hook (exit 2) blocks session close if index is stale, links are broken, or deprecated patterns found. Also warns on unverified conclusions.
- PostToolUse hook covers wiki/ and plans/ (stale-ref block) AND findings/ and output/ (CONTENT_INDEX advisory warning)
- Stop hook chain: `node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-index.sh` → `check-links.sh` → `check-stale-refs.sh` → `check-conclusions-alignment.sh`
- `watch-project.sh` requires `fswatch` (`brew install fswatch`); `check-links.sh` requires python3 (pre-installed macOS)
- `/knowledge-audit` runs 14 dimensions; Librarian runs 8 consistency dimensions
- **§7 Verification:** two levels required for governance changes — content check (text correct) + functional test (behavior correct). See Rule 15.

**Questions it answers:**
- What is the full session lifecycle and what runs at each phase?
- How do the wiki/ folder layers relate to each other compositionally?
- What scripts exist and what do each of them do?
- What are the dependencies and how do I install them on a new machine?
- How do I verify the system is healthy (content vs. functional)?
- How does the file watcher work without creating a feedback loop?

---

## Framework Templates (node_modules/.../lib/templates/)

> Full map → `node_modules/@nicolas-botero-mejia/canon/lib/templates/template-index.md`

| Template | Destination | Output naming |
|----------|-------------|---------------|
| [poc.plan-template.md(node_modules/.../lib/templates/poc.plan-template.md) | `plans/` | `phase-NN-poc-NN-[name]-plan.md` |
| [poc.results-template.md(node_modules/.../lib/templates/poc.results-template.md) | `findings/` | `phase-NN-poc-NN-[name]-results.md` |
| [poc.conclusions-template.md(node_modules/.../lib/templates/poc.conclusions-template.md) | `output/` | `phase-NN-poc-NN-[name]-conclusions.md` — includes **Addendum Candidates** section for forward signals |
| [addendum.plan-template.md(node_modules/.../lib/templates/addendum.plan-template.md) | `plans/` | `phase-NN-poc-NN-addendum-NN-[slug]-plan.md` |
| [addendum.results-template.md(node_modules/.../lib/templates/addendum.results-template.md) | `findings/` | `phase-NN-poc-NN-addendum-NN-[slug]-results.md` |
| [addendum.conclusions-template.md(node_modules/.../lib/templates/addendum.conclusions-template.md) | `output/` | `phase-NN-poc-NN-addendum-NN-[slug]-conclusions.md` |
| [signal.results-template.md(node_modules/.../lib/templates/signal.results-template.md) | `findings/` | `phase-NN-signal-NN-[slug]-results.md` |
| [research.plan-template.md(node_modules/.../lib/templates/research.plan-template.md) | `plans/` | `phase-NN-research-[topic]-plan.md` |
| [research.results-template.md(node_modules/.../lib/templates/research.results-template.md) | `findings/` | `phase-NN-research-[topic]-results.md` |
| [research.conclusions-template.md(node_modules/.../lib/templates/research.conclusions-template.md) | `output/` | `phase-NN-research-[topic]-conclusions.md` — only when research closes a tracked decision |
| [session.field-notes-template.md(node_modules/.../lib/templates/session.field-notes-template.md) | `findings/` | `phase-NN-session-NN-[topic]-field-notes.md` |
| [session.results-template.md(node_modules/.../lib/templates/session.results-template.md) | `findings/` | `phase-NN-session-NN-[topic]-results.md` |
| [session.conclusions-template.md(node_modules/.../lib/templates/session.conclusions-template.md) | `output/` | `phase-NN-session-NN-[topic]-conclusions.md` |
| [handoff.results-template.md(node_modules/.../lib/templates/handoff.results-template.md) | `findings/` | `phase-NN-handoff-[source]-to-[dest]-handoff.md` |
| [tmp.working-file-template.md(node_modules/.../lib/templates/tmp.working-file-template.md) | `tmp/` | `[descriptive-name].md` |

---

## Framework Governance Scripts (node_modules/.../lib/scripts/)

Framework scripts that power the hooks and consistency checks. Invoked by `.claude/settings.json` and `.cursor/hooks.json`.

| Script | Role |
|--------|------|
| `session-start-report.sh` | SessionStart — prints project state (file counts, pending updates) |
| `post-write-check.sh` | PostToolUse — stale-ref block on wiki/plans, CONTENT_INDEX advisory on findings/output |
| `check-index.sh` | Stop — every `.md` is listed in CONTENT_INDEX.md |
| `check-links.sh` | Stop — no broken relative markdown links (requires python3) |
| `check-stale-refs.sh` | Stop — no deprecated tool/pattern references in wiki/ |
| `check-conclusions-alignment.sh` | Stop — Complete conclusions carry an Alignment verified date |
| `phase-transition.sh` | Phase rollover helper (invoked by `/phase-new`, `/phase-conclude`) |
| `watch-project.sh` | Optional background file watcher (requires `fswatch`) |

---

## .cursor/ — Cursor Integration

Mirrors the Claude hook + rule layer for the Cursor editor.

- `.cursor/hooks.json` — sessionStart / postToolUse / stop hooks pointing at `.cursor/hooks/`
- `.cursor/hooks/` — `session-start.sh`, `post-write-check.sh`, `stop-check.sh` (wrap the same `node_modules/@nicolas-botero-mejia/canon/lib/scripts/` checks; advisory, not hard-blocking)
- `.cursor/rules/behavioral.mdc` — Cursor translation of the behavioral rules (alwaysApply)

---

## .claude/agents/ — Agent Definitions

Agents are subagent system prompts invoked by skills. Each encodes a role's knowledge, behaviors, and constraints.

### [.claude/agents/librarian.md](./.claude/agents/librarian.md)
Knowledge steward. Knows the file taxonomy (4 finding types, authorship distinction, priority order), template-index, consistency dimensions (8 total including meta-doc currency and content-type boundary drift), tmp/ lifecycle. Surfaces prior context, runs audits, flags structural changes, proposes deprecations. Never edits or deletes without human approval.

### [.claude/agents/writer.md](./.claude/agents/writer.md)
Structured document producer. Always loads prior context from Librarian before writing. Enforces naming convention, template selection, Author: metadata, and mandatory conclusions sections (Evidence Summary + Deferred Observations). Never fills human field-notes content.

### [.claude/agents/pm.md](./.claude/agents/pm.md)
Engagement state manager. Owns the decisions tracker. Surfaces open decisions before sessions/POCs, records confirmed decisions after, runs decisions audit during phase-wrap. Never marks decisions closed without explicit human confirmation.

---

## .claude/skills/ — Skills (Slash Commands)

Skills are Markdown instruction files invoked as slash commands (`/skill-name`). Each lives in its own `[name]/SKILL.md` subdirectory. All are phase-agnostic.

**Conceptual model:** Two skill layers — Phase operations (manage the engagement container) and Activity operations (manage bounded work units inside a phase).

### Phase-level skills

### [.claude/skills/phase-new/SKILL.md](./.claude/skills/phase-new/SKILL.md)
Scaffolds a new engagement phase. Confirms prior phase is concluded → runs `node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh` if needed → updates CLAUDE.md and CONTENT_INDEX.

### [.claude/skills/phase-conclude/SKILL.md](./.claude/skills/phase-conclude/SKILL.md)
Concludes a phase: decisions audit → alignment verification sweep → knowledge audit → phase summary → `node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh` → meta-doc currency check.

### Activity-level skills

### [.claude/skills/activity-new/SKILL.md](./.claude/skills/activity-new/SKILL.md)
Unified skill for starting any activity. Type argument: `poc | addendum | research | session`. 6 canonical steps: pre-flight guard → PM confirms trigger → prior context check → load context brief → create plan → create stubs → register + verify + log. Creates 2–3 files depending on type. Includes CONTENT_INDEX verification gate in Step 6.

### [.claude/skills/activity-conclude/SKILL.md](./.claude/skills/activity-conclude/SKILL.md)
Unified skill for concluding any activity. Type argument: `poc | addendum | research | session`. 6 canonical steps: load context → synthesize conclusions (type-specific: H-blocks for poc/addendum; verdict for research; results stub for session) → close decisions → flag deferred observations + retired tools → parent backlink (addendum only) → register + verify + log + set Alignment Verified. Addendum type includes Tracker Delta check.

### System skills

### [.claude/skills/wiki-manage/SKILL.md](./.claude/skills/wiki-manage/SKILL.md)
Wiki lifecycle management. Sub-commands: `add`, `update`, `deprecate`, `move`. All propose-then-approve — no file is touched without human sign-off.

### [.claude/skills/conclusions-review/SKILL.md](./.claude/skills/conclusions-review/SKILL.md)
Reviews a completed conclusions file across 4 passes: (1) patch list for existing wiki content that is wrong/stale, (2) stub fills — wiki stubs the conclusions data can fill, (3) new coverage — findings with no wiki home, (4) forward signals — Addendum Candidates section processed into addendum/POC/backlog recommendations. Includes CONTENT_INDEX pre-check at Step 1. Sets **Alignment verified:** date. Required by Rule 12 before downstream work.

### [.claude/skills/knowledge-audit/SKILL.md](./.claude/skills/knowledge-audit/SKILL.md)
Full 14-dimension knowledge base audit. Dimensions 1–12 cover contradictions (cross-file + intra-file), meta-doc currency, stale content, orphans, missing coverage, structural inconsistency, finding type compliance, tmp/ lifecycle, template coverage, parent-backlink integrity, alignment verification, and partial-update scanning. Dimension 13: concept outgrowth / file splitting detection. Dimension 14: content-type boundary audit. Output goes to tmp/ as a working file. No auto-execution on any finding.

---

## Project layer — empty in the framework template

These folders ship empty and are populated per engagement. Add index entries here as files are created.

- `wiki/standards/` → industry / domain reference — see `wiki/standards/README.md`
- `wiki/project/` → client-specific reference — see `wiki/project/README.md`
- `plans/` → engagement plans (phase index, sessions, POCs)
- `findings/` → team-generated observations (field-notes, results, handoffs)
- `output/` → synthesized conclusions and deliverables
- `raw/` → received source materials (immutable)
- `tmp/` → transient working files (each carries a `Closes when:` condition; not committed)
