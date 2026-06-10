# Content Index

**Pattern:** Karpathy LLM Wiki — content-oriented catalog. Read this first. Go to a full file only when the index points you there.

> This file is the project-wide content map. The Stop hook and `canon doctor --deep` flag unlisted or stale files at session close (advisory). Update entries immediately when files are created or moved.
>
> **How to use:** Find which file answers your question here. Don't open full files unless the index sends you. This keeps the context window lean.
>
> **Starting point.** Only the framework layer is indexed below — written once by `canon init`. The project layer (`wiki/`, `plans/`, `findings/`, `conclusions/`, `deliverables/`, `raw/`) ships empty — add entries here as you populate those folders.

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
- **Five conceptual layers:** Input (raw/) → Process (plans/ + findings/ + conclusions/) → Knowledge (wiki/) → Output (deliverables/) → Transient (tmp/)
- **CLAUDE.md target:** Under 200 lines; no research content; behavioral rules at principle level only
- **Prefix naming convention:** Phase prefix on all findings/, conclusions/, and plans/ files
- **Wiki subdirectories:** standards/ (industry) | project/ (client decisions) | client/ (org knowledge) | user/ (user research)
- **Update triggers:** Confirmed facts → CLAUDE.md; research → wiki; session outcomes → findings; synthesized activity conclusions → conclusions/; client-facing artifacts → deliverables/
- **6-month test:** Could someone use this file in 6 months, without being in the project, to answer a real question?
- **Active skills:** Phase: `/phase-new`, `/phase-update`, `/phase-deprecate`, `/phase-reorder`, `/phase-conclude` | Activity: `/activity-new [type]`, `/activity-update`, `/activity-deprecate`, `/activity-migrate`, `/activity-conclude [type]` | System: `/wiki-manage`, `/knowledge-audit`, `/conclusions-review`, `/signal`

**Questions it answers:**
- What belongs in CLAUDE.md vs. wiki vs. plans vs. findings vs. deliverables?
- When and how do I update CLAUDE.md after a session?
- What is the naming convention for findings and output files?
- How does our structure compare to Karpathy's LLM Wiki pattern?
- When should I create a new plan version vs. updating the existing one?

---

### template-index.md (framework templates — node_modules/.../lib/templates/)
**What it is:** Template map and index for all project templates. Naming convention: `[process-type].[file-type]-template.md`. One row per template with destination folder, file suffix, and when to use it.

**Key facts:**
- **Mandatory sections in every POC session plan:** Prerequisites (with roadmap link), Context, Validation table, Hypotheses table, External Validation step (second-to-last), Conclusion Synthesis + Wiki Update step (last), Success Criteria, POC Roadmap Position.
- **Mandatory sections in every POC conclusions file:** Per-hypothesis blocks (status / finding / decision / wiki update), Decisions Closed table, Wiki Files Updated table, Addendum Candidates table (forward signals for /conclusions-review pass 4).

**Questions it answers:**
- What template should I use for a new POC, session, research activity, or addendum?
- What sections are required in a conclusions file or session plan?

---

### system-architecture.md (framework wiki — node_modules/.../lib/wiki/)
**What it is:** Technical reference for the self-maintaining knowledge system — Phase vs. Activity skill model, session lifecycle, knowledge layer relationships, hooks, scripts, templates, file watcher, dependency requirements, and verification.

**Key facts:**
- **Phase vs. Activity model (§1.1):** Two lifecycle levels — Phase: `/phase-new`, `/phase-update`, `/phase-deprecate`, `/phase-reorder`, `/phase-conclude`; Activity: `/activity-new [type]`, `/activity-update`, `/activity-deprecate`, `/activity-migrate`, `/activity-conclude [type]` — four activity types (poc | addendum | research | session)
- **§1.2 Session lifecycle diagram**: BACKGROUND → SESSION START → PRE-WORK SETUP → WORK PHASE → CLOSE → SESSION STOP → PERIODIC
- **§1.3 Knowledge layer diagram**: raw/ → findings/ → conclusions/ feeds wiki/project/; standards/ from external knowledge; node_modules/.../lib/wiki/ + .claude/ are the system layer
- **Scripts split:** `node_modules/@nicolas-botero-mejia/canon/lib/scripts/` (governance scripts dispatched by `bin/hook.sh`) | `scripts/project/` (empty extension point — projects add deliverable scripts)
- Stop hook is **advisory** (always exits 0) — surfaces issues at session end but never blocks. Sub-checks exit non-zero; hook.sh absorbs them (ADR-013).
- PostToolUse hook covers wiki/ and plans/ (stale-ref block) AND findings/ and conclusions/ (CONTENT_INDEX advisory warning)
- Stop hook chain: `check-index.sh` → `check-links.sh` → `check-stale-refs.sh` → `check-conclusions-alignment.sh` → `check-contracts.sh` → `check-addendum-integrity.sh`
- `watch-project.sh` requires `fswatch` (`brew install fswatch`); `check-links.sh` requires python3 (pre-installed macOS)
- **§7 Verification:** two levels required for governance changes — content check (text correct) + functional test (behavior correct). **§7.1** maps the four-layer governance stack: decisions → invariants → guards → runtime.

**Questions it answers:**
- What is the full session lifecycle and what runs at each phase?
- How do decisions (ADRs), invariants, and tests relate to each other?
- How do the wiki/ folder layers relate to each other compositionally?
- What scripts exist and what do each of them do?
- What are the dependencies and how do I install them on a new machine?
- How do I verify the system is healthy (content vs. functional)?

---

## Framework Templates (node_modules/.../lib/templates/)

> Full map → `node_modules/@nicolas-botero-mejia/canon/lib/templates/template-index.md` — one row per template with destination folder, output naming, and when to use it. The `template-index.md` entry above answers "which template do I use."

---

## Framework Governance Scripts (node_modules/.../lib/scripts/)

One dispatcher (`node_modules/@nicolas-botero-mejia/canon/bin/hook.sh`) routes SessionStart / PostToolUse / Stop events to the governance scripts. The full script list and per-script behavior → `system-architecture.md` entry above.

---

## .cursor/ — Cursor Integration

Mirrors the Claude hook + rule layer for the Cursor editor.

- `.cursor/hooks.json` — sessionStart / postToolUse / stop hooks; all delegate to `node_modules/@nicolas-botero-mejia/canon/bin/hook.sh` (same unified dispatcher as `.claude/settings.json`)
- `.cursor/rules/behavioral.mdc` — Cursor translation of the behavioral rules (alwaysApply)

---

## .claude/agents/ — Agent Definitions

Agents are subagent system prompts invoked by skills. Each encodes a role's knowledge, behaviors, and constraints.

### [.claude/agents/librarian.md](./.claude/agents/librarian.md)
Knowledge steward. Knows the file taxonomy, template-index, and consistency dimensions. Surfaces prior context, runs audits, flags structural changes, proposes deprecations. Never edits or deletes without human approval.

### [.claude/agents/writer.md](./.claude/agents/writer.md)
Structured document producer. Always loads prior context from Librarian before writing. Enforces naming convention, template selection, Author: metadata, and mandatory conclusions sections. Never fills human field-notes content.

### [.claude/agents/pm.md](./.claude/agents/pm.md)
Engagement state manager. Owns the decisions tracker. Surfaces open decisions before sessions/POCs, records confirmed decisions after, runs decisions audit during phase-wrap. Never marks decisions closed without explicit human confirmation.

---

## .claude/skills/ — Skills (Slash Commands)

Skills are Markdown instruction files invoked as slash commands (`/skill-name`). Each lives in its own `[name]/SKILL.md` subdirectory. All are phase-agnostic.

**Conceptual model:** Two skill layers — Phase operations (manage the engagement container) and Activity operations (manage bounded work units inside a phase).

### Phase-level skills

### [.claude/skills/phase-new/SKILL.md](./.claude/skills/phase-new/SKILL.md)
Scaffolds a new engagement phase. Confirms prior phase is concluded → runs phase-transition if needed → updates CLAUDE.md and CONTENT_INDEX.

### [.claude/skills/phase-update/SKILL.md](./.claude/skills/phase-update/SKILL.md)
Surgical update to an active phase's index or roadmap: add/close decisions in the tracker, update the session map, modify the roadmap, or revise the scope statement.

### [.claude/skills/phase-conclude/SKILL.md](./.claude/skills/phase-conclude/SKILL.md)
Concludes a phase: decisions audit → alignment verification sweep → knowledge audit → phase summary → phase transition → meta-doc currency check.

### [.claude/skills/phase-deprecate/SKILL.md](./.claude/skills/phase-deprecate/SKILL.md)
Deprecates an active phase that will not be concluded: resolves open decisions, handles in-progress activities (each needs an explicit fate), archives plans, logs the decision.

### [.claude/skills/phase-reorder/SKILL.md](./.claude/skills/phase-reorder/SKILL.md)
Swaps the numbers of two active phases: renames all associated files via three-step atomic rename, updates internal references, logs the swap.

### Activity-level skills

### [.claude/skills/activity-new/SKILL.md](./.claude/skills/activity-new/SKILL.md)
Starts any activity. Type argument: `poc | addendum | research | session`. Pre-flight guard → PM confirms trigger → prior context check → load context brief → create plan → create stubs → register + verify + log.

### [.claude/skills/activity-update/SKILL.md](./.claude/skills/activity-update/SKILL.md)
Surgically revises an in-progress activity's plan: scope, hypotheses, or plan structure. Does not change status or produce conclusions.

### [.claude/skills/activity-conclude/SKILL.md](./.claude/skills/activity-conclude/SKILL.md)
Concludes any activity. Type argument: `poc | addendum | research | session`. Load context → synthesize conclusions (type-specific) → close decisions → flag deferred observations → register + verify + log + set Alignment Verified.

### [.claude/skills/activity-deprecate/SKILL.md](./.claude/skills/activity-deprecate/SKILL.md)
Marks an activity as abandoned without conclusions: updates plan frontmatter, clears roadmap and backlog entries, logs the decision.

### [.claude/skills/activity-migrate/SKILL.md](./.claude/skills/activity-migrate/SKILL.md)
Moves a Planned activity from one phase to another: ports the plan file, updates roadmaps and CONTENT_INDEX in both phases, logs the move. Planned activities only.

### System skills

### [.claude/skills/wiki-manage/SKILL.md](./.claude/skills/wiki-manage/SKILL.md)
Wiki lifecycle management. Sub-commands: `add`, `update`, `deprecate`, `move`. All propose-then-approve — no file is touched without human sign-off.

### [.claude/skills/conclusions-review/SKILL.md](./.claude/skills/conclusions-review/SKILL.md)
Reviews a completed conclusions file across 4 passes: patch list → stub fills → new coverage → forward signals. Sets the **Alignment verified:** date. Required before downstream work depends on the conclusions.

### [.claude/skills/knowledge-audit/SKILL.md](./.claude/skills/knowledge-audit/SKILL.md)
Full 15-dimension knowledge base audit — contradictions, meta-doc currency, stale content, orphans, structural consistency, addendum integrity, alignment verification, and more. Output goes to tmp/ as a working file. No auto-execution on any finding.

### [.claude/skills/signal/SKILL.md](./.claude/skills/signal/SKILL.md)
Captures an external discovery in 2 minutes without interrupting current work. Works whether or not an activity is open. Routes to addendum / POC / backlog later.

---

## Project layer — empty at init

These folders ship empty and are populated per engagement. Add index entries here as files are created.

- `wiki/standards/` → industry / domain reference
- `wiki/project/` → client-specific decisions (what was chosen)
- `wiki/client/` → org knowledge (stakeholders, decision-making, engagement context)
- `wiki/user/` → end-user research
- `plans/` → engagement plans (phase index, sessions, POCs)
- `findings/` → team-generated observations (field-notes, results, handoffs)
- `conclusions/` → synthesized conclusions (team-internal)
- `deliverables/` → client-facing formal artifacts
- `raw/` → received source materials (immutable)
- `tmp/` → transient working files (each carries a `Closes when:` condition; not committed)
