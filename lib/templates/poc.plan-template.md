# Phase N — POC XX: [Title]

<!--
TEMPLATE — copy this file, rename it, fill in the brackets.
Naming convention: plans/phase-NN-poc-NN-[short-name]-session.md
Status values: Draft | Planned | In Progress | Complete
-->

**Last updated:** YYYY-MM-DD
**Status:** Draft
**Duration:** Xh
**Type:** Internal technical [+ design if design lead is required]
**Participants:** [tech lead] (required) · [other roles]
**Project root:** `/absolute/path/to/project` ← fill with the absolute path to the knowledge-base project at creation time

> Roadmap + dependency graph → `plans/phase-NN-poc-roadmap.md`
> Conclusions (stub created by `/activity-new poc`; fill via `/activity-conclude poc`) → `conclusions/phase-NN-poc-NN-[name]-conclusions.md`
> **Skill origin:** `/activity-new poc`, `/activity-conclude poc`, and all other `/skill-name` references in this plan are **project-local skills** — they live in `[project-root]/.claude/skills/`. Do not add a namespace prefix (e.g. `anthropic-skills:`). See Rule 14 in `.claude/rules/behavioral.md`.
> Prior POC context → `conclusions/phase-NN-poc-0[N-1]-[prev-name]-conclusions.md`
> All file paths in this plan are relative to **Project root**. If executing from a different working directory, resolve against the absolute path above.

---

## Prerequisites

**Check the roadmap before starting.** `plans/phase-NN-poc-roadmap.md`

<!--
List every predecessor POC that must be complete, plus any practical setup items.
Use [ ] for items that need verification before the session starts.
If this POC can run in parallel with another, say so explicitly.
-->

- [ ] POC 0N-1 complete — [what it confirmed]
- [ ] [Practical setup item — e.g., test repo with X configured]
- [ ] [Required Figma plugin / MCP server / skill] confirmed active
- [ ] [Saved output from previous POC needed — specify file path]

> **Can run in parallel with:** [POC 0N or "None — this POC has no parallel counterpart"]

> **Escalation protocol:** If any prerequisite above cannot be satisfied, **stop and ask the user before proceeding**. Do not attempt workarounds (running tools from temp files, reimplementing skills inline, skipping the step). State exactly which prerequisite is missing and what is needed to unblock it.

---

## Context: What the Previous POC Left Open

<!--
2–4 sentences. What gap does this POC close?
What did the previous POC confirm that this one builds on?
What did the previous POC NOT test that this one covers?
-->

[Previous POC] confirmed [X]. What it did NOT test was [Y]. This POC answers: [core question in plain English].

---

## What This POC Validates

<!--
Table of 3–7 items. Each row = one testable area.
"Area" = the thing being tested.
"Question" = the specific yes/no question.
"Why it matters" = the consequence if the answer is no.
-->

| Area | Question | Why it matters |
|------|----------|----------------|
| **H1** [Short label] | [Specific yes/no question] | [What breaks if the answer is no] |
| **H2** [Short label] | [Specific yes/no question] | [What breaks if the answer is no] |
| **H3** [Short label] | [Specific yes/no question] | [What breaks if the answer is no] |

---

## Hypotheses

<!--
One row per hypothesis. Same count as the "What This POC Validates" table.
"Expected result" = what you think will happen (CONFIRMED / REFUTED / PARTIAL).
"What would refute it" = specific observable evidence that would disprove it.
-->

| # | Hypothesis | Expected result | What would refute it |
|---|-----------|----------------|---------------------|
| H1 | [Statement of what you expect to be true] | CONFIRMED | [Specific observable evidence that would disprove it] |
| H2 | [Statement of what you expect to be true] | CONFIRMED | [Specific observable evidence that would disprove it] |
| H3 | [Statement of what you expect to be true] | CONFIRMED | [Specific observable evidence that would disprove it] |

---

## Session Flow

<!--
Numbered steps. Each step has: goal, method (code blocks if relevant), and record items.
Time estimates are optional but helpful.
The LAST TWO steps are always:
  - External validation (web search cross-reference)
  - Conclusion synthesis + wiki update
These are mandatory — do not remove or rename them.
-->

### Step 1 — [Name] (X min)

**Goal:** [One sentence — what this step proves or produces]

[Method description. Include code blocks where relevant.]

```bash
# example command or script
```

**Record:**
- [What to write down — specific observable output]
- [What to write down — specific observable output]

---

### Step 2 — [Name] (X min)

**Goal:** [One sentence]

[Method]

**Record:**
- [What to write down]

---

<!-- ... repeat for each step ... -->

---

### Step [N-1] — External Validation (30 min)

<!--
MANDATORY — do not remove. Always second-to-last.
Web search cross-reference to validate findings and catch gaps.
-->

Web search cross-reference. Validate POC findings against community experience:

- [Specific question to search — e.g., "Has anyone documented X behavior?"]
- [Specific question to search]
- [Specific question to search]

Update findings notes for any contradictions or new gaps discovered.

---

### Step [N] — Conclusion Synthesis + Wiki Update (45 min)

<!--
MANDATORY — do not remove. Always last.
All file paths below are relative to the Project root declared in the plan metadata.
If executing from a different working directory, prefix each path with that absolute root.
-->

> **Path anchor:** All files in this step live under `[Project root]`. Resolve against the absolute path in the plan header if running from outside that directory.

**Conclusions file (stub already exists):** `[Project root]/conclusions/phase-NN-poc-NN-[name]-conclusions.md`

For each hypothesis (H1–HN): status (CONFIRMED / REFUTED / PARTIAL), finding, decision, wiki update.

**Wiki update review:** After conclusions are written, audit every wiki file for staleness:
- Which files need updating based on this POC's findings?
- Which new files are needed?
- Which concepts are now superseded?

Files most likely to update:
- [List specific wiki files with section references — prefix with `[Project root]/`]
- `[Project root]/plans/phase-NN-index.md §Decisions Tracker` — close decisions unlocked by this POC
- `[Project root]/plans/phase-NN-poc-roadmap.md` — mark this POC complete

Append to `[Project root]/log.md`. One entry per file changed.

---

## Success Criteria

<!--
Numbered table. Each row = one measurable outcome.
The last two rows are always the conclusions doc and decisions tracker update.
-->

| # | Criterion | Notes |
|---|-----------|-------|
| 1 | [Specific measurable outcome] | [Any clarifying notes] |
| 2 | [Specific measurable outcome] | |
| 3 | Conclusions document complete with all N hypotheses resolved | `conclusions/phase-NN-poc-NN-[name]-conclusions.md` |
| 4 | Relevant decisions closed in tracker | `plans/phase-NN-index.md §Decisions Tracker` |

---

## POC Roadmap Position

<!--
Always include this table. Bold the current POC row.
Copy the current state from plans/phase-NN-poc-roadmap.md — don't invent statuses.
-->

<!--
Replace the rows below with the actual POC list from plans/phase-NN-poc-roadmap.md.
Bold the current POC row. Do not invent statuses.
-->

| POC | Status | Depends on |
|-----|--------|-----------|
| **POC NN — [This POC title]** | **In Progress** | **POC NN-1** |
| POC NN+1 — [Next POC title] | Planned | POC NN |
| [Copy remaining rows from phase-NN-poc-roadmap.md] | | |
