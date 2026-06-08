---
name: conclusions-review
description: Analytically review concluded documents to verify system alignment, surface dependency chains, identify stale files, and produce a prioritized patch list.
compatibility: Claude Code
---
# /conclusions-review

Analytically review one or more concluded documents to verify system alignment, surface dependency chains, identify stale files, and produce a prioritized patch list.

## When to use
- At session start when picking up after concluded work
- After receiving conclusions from an external source or async session
- When suspected concluded work didn't fully propagate through wiki, roadmap, or backlog
- Before running `/activity-new [type]` when the new work depends on prior conclusions that don't yet have an `**Alignment verified:**` date — see Rule 12 in `.claude/rules/behavioral.md`
- Narrow alternative to `/knowledge-audit` when scoping review to a specific document

## Arguments
- File path(s) relative to project root, space-separated — OR `"recent"` to target the most recently completed conclusions file (latest `**Synthesis date:**` with `**Status:** Complete` in `conclusions/`)
- `--parent` (optional): also load and cross-check the parent conclusions file (auto-applied when target is an addendum)

## What happens

**Step 1 — Load target conclusions + context**

> **Pre-check — CONTENT_INDEX registration:** Before any analysis, verify the target conclusions file and its linked source (results) and plan files appear in `CONTENT_INDEX.md` (search for each `/$filename`). If any are absent: register them now and add a HIGH item to the patch list. This is a pre-condition — do not proceed with the review until all three files are registered.

For each target conclusions file, load:
1. The conclusions file itself
2. `plans/phase-NN-poc-roadmap.md`
3. `plans/phase-NN-index.md §Decisions Tracker`
4. Each file listed in the conclusions `## Wiki Files Updated` table
5. Parent conclusions file (if addendum or if `--parent` flag set)

Report what loaded and flag any file that cannot be found (missing file = immediate HIGH item).

**Step 2 — Wiki Files Updated verification**
For each row in the conclusions `## Wiki Files Updated` table: open the file, navigate to the listed section, verify the claimed change is present.
Result per row: ✅ Present / ⚠️ Partial / ❌ Missing.
Flag every ❌ and ⚠️ as a HIGH patch item.

**Step 3 — Roadmap check**
In `plans/phase-NN-poc-roadmap.md`:
- Is this POC/addendum listed in the Full POC Table with correct status (✅ Complete)?
- For addendums: is there a dedicated addendum row?
Flag missing rows or wrong status as MEDIUM patch items.

**Step 4 — Downstream Dependencies check**
If the conclusions file's plan has a `## Downstream Dependencies` table:
- Load each downstream POC/session plan listed
- For each: is the dependency acknowledged in its prerequisites or hypothesis notes?
- Given this addendum's verdict, does the downstream plan need updating?

If no `## Downstream Dependencies` section exists in the plan (pre-template plans):
Report: "Plan predates downstream dependency tracking. Manual check recommended for plans that depend on this document."

Flag unacknowledged dependencies as MEDIUM patch items.

**Step 5 — Deferred Observations audit**
For each item in conclusions `## Deferred Observations`:
- Does a `plans/discovery-backlog.md` entry exist for it?
- Is its status current?
Flag missing entries as MEDIUM, stale status as LOW.

> **Calibration note:** `plans/discovery-backlog.md` is scoped to *external* discoveries (signals and addendums from outside sources). Internal low-priority deferred observations (e.g., a known bug to patch later, a fix path not currently needed) live in the conclusions file itself and do not require a backlog entry. Only flag as MEDIUM/LOW if the deferred item represents an *actionable* open question that needs tracking beyond the conclusions file — not every deferred observation warrants a backlog row.

**Step 6 — Produce prioritized patch list**

Output a structured report:

**Issues Found** (table):
| Priority | File | Section | Issue |
|----------|------|---------|-------|
| HIGH | path | §Section | description |
| MEDIUM | ... | ... | ... |
| LOW | ... | ... | ... |

Priority rules:
- HIGH: Wiki update ❌ Missing, or decision unclosed despite appearing in Decisions Closed table
- MEDIUM: Roadmap row missing or wrong status, downstream plan not updated for a verdict that changes it, deferred observation missing from backlog
- LOW: Stale date, wrong label, minor inconsistency

**Next action summary** (one paragraph):
1. Is concluded work system-aligned? (yes / mostly / no)
2. The single most important patch to apply first
3. Should `/activity-new addendum` be run next? (if deferred observations map to a planned addendum)
4. Should `/knowledge-audit` follow? (if issues suggest systemic drift beyond this document)

**Step 7 — Pass 2: Stub fills**
Scan all wiki/project/ and wiki/standards/ files for stub markers:
- Patterns: `[stub]`, `_TBD_`, `*(to be written)*`, `*(not yet documented)*`, `*(fill)*`, `> stub`, `<!-- stub`

For each stub found, check whether any hypothesis finding in the current conclusions file contains data that would fill it. A match exists when:
- The stub's section topic aligns with a confirmed finding (e.g., a stub in §Styles Extraction would match H13 CONFIRMED — `get-styles.js` details)
- The stub is in a file listed in the conclusions `## Wiki Files Updated` table (strong signal)

Output per match:
- File and section containing the stub
- Which hypothesis fills it
- A suggested one-paragraph fill (derived from the conclusions finding)

If no stubs match → write "Pass 2 — No stub fills identified."

**Step 8 — Pass 3: New coverage**
For each hypothesis finding in the conclusions, check whether the specific concept, tool, or decision it introduces has a corresponding wiki section or stub anywhere in wiki/project/ or wiki/standards/.

A finding has no wiki home when:
- The tool/concept it introduces (e.g., a specific script, a bug, a caveat) is not mentioned in any wiki file
- The finding's decision has actionable implications that are not captured in any existing wiki section

For each uncovered finding, propose either:
- A new section in an existing file (if the topic clearly fits the file's stated scope — state which file and section header)
- A new stub file (if the concept warrants its own entry — propose filename and parent file stub link)

Output per uncovered finding: hypothesis ID, what's missing, proposed home.
If all findings have wiki coverage → write "Pass 3 — All findings have wiki coverage."

**Step 9 — Pass 4: Forward signals**
Read the `## Addendum Candidates` section of the conclusions file (if present).
For each entry, recommend one of:
- **Addendum** to this POC — when the signal is a PARTIAL verdict or proxy-tested result from this exact POC that warrants a follow-up hypothesis
- **New POC** — when the signal introduces a distinct, testable question outside this POC's scope
- **Backlog entry** — when the signal is a deferred observation or low-priority open question (reference Rule 11 for distinction)

Also check `## Deferred Observations` for any items that should have an Addendum Candidates entry but don't. Flag those as missing forward signals.

Output: structured recommendation per signal (type, description, recommended action).
If the section is absent → write "Pass 4 — No Addendum Candidates section found. If this POC has PARTIAL verdicts or deferred hypotheses, consider adding this section to the conclusions file."

**Step 10 — Set Alignment Verified field**
After all passes complete (regardless of whether issues were found):

**For full conclusions files (poc, research, session):** Write the current date to the `**Alignment verified:**` field in the target conclusions file:
```
**Alignment verified:** YYYY-MM-DD
```

**For addendum targets (`--addendum NN` flag or when target is identified as an addendum section):** Set `**Addendum alignment verified:** YYYY-MM-DD` in the `## Addendum NN` section of the parent file, NOT the file-level `**Alignment verified:**` field. The file-level date is only updated when the user explicitly requests a full top-to-bottom review of the parent file. When the target is an addendum, also cross-check the appended section against the parent's decisions and H-numbers (auto-applied).

Example addendum invocation: `conclusions-review phase-01-poc-01-conclusions.md --addendum 02`

This is the only file write this skill performs. It marks the file or section as reviewed so Rule 12 does not re-trigger. If the review found HIGH issues, the date is still set — it means "reviewed on this date, issues exist and are tracked in the patch list above," not "all clear."

## Output
- Pass 1: Patch list (corrections to existing content)
- Pass 2: Stub fill opportunities
- Pass 3: Proposed new wiki coverage for uncovered findings
- Pass 4: Forward signal recommendations (addendum / new POC / backlog)
- `**Alignment verified:**` field set on each target conclusions file
- Optional persistent copy in `tmp/` only if user requests it (then: `tmp/phase-NN-conclusions-review-YYYY-MM-DD.md` using `tmp.working-file-template.md`)

## What this skill does NOT do
- Auto-apply any patch — all changes require human review and execution
- Open files not referenced in the conclusions document or wiki/project/
- Replace `/knowledge-audit` (which covers the full system, not a specific document)
- Replace `/activity-conclude [type]` (which synthesizes raw results into conclusions — this skill reviews already-concluded work)
