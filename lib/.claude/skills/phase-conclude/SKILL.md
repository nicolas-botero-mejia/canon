# /phase-conclude

Conclude the current phase: audit open decisions, run a knowledge audit, write the phase summary, and execute the phase transition.

## When to use
After Session 8 (scope confirmation) — the final client session of Phase 1. All client decisions should be closed or explicitly deferred before running this.

## Arguments
- Current phase number (required): e.g., `01`
- Next phase number (required): e.g., `02`

## What happens

**Step 1 — PM: decisions audit**
Reads `plans/phase-NN-index.md §Decisions Tracker`. Reports:
- All decisions still marked Open: *"[N] decisions remain Open. These must close or be explicitly deferred before Phase 2."*
- For each open decision: which session was supposed to close it? Is it phase-blocking?
- Proposed deferral format: `Deferred — [reason] — revisit at [Phase 2 trigger]`
- **Pause here.** Human reviews and confirms: close each remaining decision or approve deferral with reason.

**Step 1b — Alignment verification sweep**
Before the knowledge audit: scan all Complete conclusions files in `conclusions/` for the `**Alignment verified:**` field.
- Any file with an empty or absent field → surface it: *"[file] has not been alignment-verified. Run `/activity-conclude [type]` or `/conclusions-review [file]` to set the field before concluding the phase."*
- Also scan every parent POC conclusions file for `## Addendum NN` sections that are missing `**Addendum alignment verified:**` dates. Surface alongside unverified file-level conclusions: *"[file] §Addendum NN has no `**Addendum alignment verified:**` date. Run `/conclusions-review` targeting this section or set the date manually before concluding the phase."*
- This is a pre-wrap gate: unverified conclusions carry forward unknown drift into the next phase. Human decides whether to verify now or explicitly accept the risk and proceed.

**Step 2 — /knowledge-audit (inline)**
Runs the full 11-dimension audit (including alignment verification coverage — Dimension 11). Output goes to `tmp/phase-NN-knowledge-audit-pre-wrap-YYYY-MM-DD.md`.
Flags anything blocking the transition (especially meta-doc drift, contradictions, or empty alignment fields).
**Pause here if critical issues found.** Human decides whether to fix before transition or defer.

**Step 3 — Writer: phase summary**
Using `session.conclusions-template.md` as structural reference:
- File: `conclusions/phase-NN-summary.md`
- Author: AI
- Content: full Phase 1 synthesis — what was proven (POC 01, 02), what was confirmed (client decisions), what was learned (session findings), what goes into Phase 2 (open items, deferred observations, first POCs/sessions)
- Derived from: all session conclusions, POC conclusions, and the decisions tracker state

**Step 4 — node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh**
Skip this step if `/phase-new` already ran the transition script for the new phase.
Executes: `bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh 01 02`
- Archives current phase plans → `plans/_archive/phase-01/`
- Scaffolds next phase index from template
- Updates CONTENT_INDEX.md and CLAUDE.md pointers
- Appends to log.md

**Step 5 — Librarian: meta-doc currency check**
Confirms `system-architecture.md (framework wiki)` and `system-operations.md (framework wiki)` are current for the new phase. If any structural changes happened during Phase 1 that weren't reflected, flags them now.

**Step 6 — Register and log**
- Add phase summary to CONTENT_INDEX.md
- Final log.md entry: *"Phase 1 → Phase 2 transition complete. [N] decisions closed. [M] deferred. Phase summary written."*

## Output
- `conclusions/phase-01-summary.md` — full phase synthesis
- `tmp/phase-01-knowledge-audit-pre-wrap-YYYY-MM-DD.md` — final audit
- Decisions tracker fully resolved (all Open → Closed or Deferred)
- Phase transition executed (archive + new phase scaffolded)
- Both check scripts pass
