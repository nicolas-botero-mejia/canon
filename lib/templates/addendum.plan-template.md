# Phase N — [Parent Identifier] Addendum NN: [Title] — Plan

<!--
TEMPLATE — copy this file, rename it, fill in the brackets.
Naming convention: plans/phase-NN-[parent-identifier]-addendum-NN-[slug]-plan.md

[parent-identifier] = the parent document's own identifier segment, e.g.:
  poc-02                    → phase-01-poc-02-addendum-01-native-mcp-skills-plan.md
  research-mcp-landscape    → phase-01-research-mcp-landscape-addendum-01-native-tools-plan.md
  session-04                → phase-01-session-04-addendum-01-redy-followup-plan.md

Status values: Draft | Planned | In Progress | Complete

Use this template when an external discovery EXTENDS an existing closed POC, research, or session document.
If the discovery has no parent document, use signal.results-template.md instead.
-->

**Last updated:** YYYY-MM-DD
**Status:** Draft
**Duration:** Xh
**Type:** Internal technical
**Participants:** [tech lead] (required) · [other roles]
**Parent conclusions:** `conclusions/phase-NN-[parent-identifier]-conclusions.md`
**Parent last hypothesis:** HN ← copy the last H-number from the parent conclusions file
**Project root:** `/absolute/path/to/project` ← fill with the absolute path to the knowledge-base project at creation time

> Parent conclusions → [link]
> Results (fill during/after execution) → `findings/phase-NN-[parent-identifier]-addendum-NN-[slug]-results.md`
> Addendum conclusions → appended as `## Addendum NN` in the parent POC conclusions file by `/activity-conclude addendum`
> Addendum numbering is per-parent and sequential. If parent has no prior addendums, this is 01.
> All file paths in this plan are relative to **Project root**. If executing from a different working directory, resolve against the absolute path above.
> **Skill origin:** All `/skill-name` references in this plan (e.g. `/activity-conclude poc`, `/wiki-manage`) are **project-local skills** in `[project-root]/.claude/skills/`. Do not add a namespace prefix. See Rule 14 in `.claude/rules/behavioral.md`.

---

## Parent: Decisions Reviewed

<!--
List only the decisions from the parent that this addendum may revise.
Copy decision text verbatim from the parent conclusions §Decisions Closed table.
Do not list decisions this addendum won't touch.
-->

| Decision | Parent verdict | Status for this addendum |
|----------|---------------|--------------------------|
| [Decision text from parent] | [What the parent concluded] | Under review |
| [Decision text] | [Parent verdict] | Under review |

---

## Trigger

<!--
What prompted this addendum? Be specific — include the source, date, and what it showed.
-->

**Source:** [Article title / tool release / community post — with URL if available]
**Author/publisher:** [Name or organization]
**Date:** YYYY-MM-DD
**What it showed:** [2–3 sentences — what the source demonstrated, claimed, or released]
**Why this extends the parent:** [1–2 sentences — which specific parent decision(s) this challenges or adds to]

---

## Pre-session Prerequisites

<!--
List every tool, plugin, skill, or file that must be available before execution begins.
Each item should be verifiable before the session starts — not discovered mid-step.
-->

- [ ] [Required Figma plugin / MCP server] confirmed active
- [ ] [Required project-local skill in `[project-root]/.claude/skills/`] confirmed
- [ ] [Any output from parent POC or prior addendum needed — specify file path]
- [ ] Parent conclusions file loaded and reviewed

> **Escalation protocol:** If any prerequisite above cannot be satisfied, **stop and ask the user before proceeding**. Do not attempt workarounds (running tools from temp files, reimplementing skills inline, skipping the step). State exactly which prerequisite is missing and what is needed to unblock it.

---

## Hypothesis Extensions

<!--
Continue numbering from where the parent document left off.
Check **Parent last hypothesis:** in the metadata above and start the next number.
Use the same format as the parent's hypotheses table.
-->

| # | Hypothesis | Expected result | What would refute it |
|---|-----------|----------------|---------------------|
| H8 | [Statement of what you expect to be true] | CONFIRMED | [Specific observable evidence that would disprove it] |
| H9 | [Statement] | CONFIRMED | [What would disprove it] |

---

## Test Approach

<!--
Steps to test the hypotheses. Follow the same format as POC session flow.
The LAST TWO steps are always External Validation and Conclusion Synthesis — mandatory.
-->

### Step 1 — [Name] (X min)

**Goal:** [One sentence — what this step proves or produces]

[Method description. Include code blocks or tool calls where relevant.]

**Record:**
- [What to observe and write down]

---

### Step 2 — [Name] (X min)

**Goal:** [One sentence]

[Method]

**Record:**
- [What to observe]

---

<!-- Repeat for each step -->

---

### Step [N-1] — External Validation (20 min)

<!--
MANDATORY — always second-to-last.
Web search to validate findings against community experience and confirm nothing was missed.
-->

- [Specific search query]
- [Specific search query]

---

### Step [N] — Addendum Conclusions + Wiki Update (30 min)

<!--
MANDATORY — always last.
All file paths below are relative to the Project root declared in the plan metadata.
If executing from a different working directory, prefix each path with that absolute root.
-->

> **Path anchor:** All files in this step live under `[Project root]`. Resolve against the absolute path in the plan header if running from outside that directory.

For each hypothesis (H8–HN): status, finding, decision impact, wiki update needed.

**After conclusions are written:**
- Append `## Addendum NN` section to the parent POC conclusions file → `[Project root]/conclusions/phase-NN-[parent-identifier]-conclusions.md` (done by `/activity-conclude addendum`)
- Close or revise affected decisions → `[Project root]/plans/phase-NN-index.md §Decisions Tracker`
- Update any wiki files where the parent decision changed → `[Project root]/wiki/project/[file].md`
- Update discovery backlog → `[Project root]/plans/discovery-backlog.md`

---

## Success Criteria

| # | Criterion | Notes |
|---|-----------|-------|
| 1 | [Specific measurable outcome per hypothesis] | |
| 2 | Addendum conclusions complete with all new hypotheses resolved | Appended as `## Addendum NN` in parent file |
| 3 | Parent POC conclusions file has the appended `## Addendum NN` section | `conclusions/phase-NN-[parent-identifier]-conclusions.md` |
| 4 | Affected decisions revised in tracker | `plans/phase-NN-index.md §Decisions Tracker` |

---

## Downstream Dependencies

<!--
Declare which future POCs, sessions, or addendums depend on the outcome of this addendum.
Fill at plan creation time. Review again at conclusions — if a verdict changes, check every item here.
Impact if verdict changes: what would need to be re-examined if this addendum's outcome proves wrong.
If no downstream items are identified, write "None identified." — do not leave blank.
-->

| POC / Session | Depends on this addendum for | Impact if verdict changes |
|---------------|------------------------------|--------------------------|
| [identifier]  | [what it needs to know]      | [consequence]            |

---

## Expected Outputs

- `findings/phase-NN-[parent-identifier]-addendum-NN-[slug]-results.md` — execution log
- `## Addendum NN` section appended to parent POC conclusions file — verdicts + revised decisions
- Wiki file updates for any decisions that change
- `plans/discovery-backlog.md` entry updated to "Complete"
