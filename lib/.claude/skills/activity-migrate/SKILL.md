# /activity-migrate

Move a Planned activity from one phase to another: port the plan file, update roadmaps and CONTENT_INDEX in both phases, and log the move.

## When to use
- A planned POC or session needs to move to a different phase before work begins
- Phase scope changed and an unstarted activity belongs in a later or earlier phase

**Only Planned activities can be migrated.** In Progress = conclude or deprecate first. Completed = create an addendum in the target phase instead.

## Arguments
- `type` (required): `poc` | `addendum` | `research` | `session`
- Activity identifier (required): e.g., `poc-02`
- Source phase number (required): e.g., `01`
- Target phase number (required): e.g., `02`

## Fail-safes

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Activity results file exists with content (In Progress) | **Hard block** | "Cannot migrate an In Progress activity. Conclude or deprecate it first, then create a new one in the target phase." |
| 2 | Conclusions file exists (Completed) | **Hard block** | "Cannot migrate a concluded activity. Its conclusions are part of the source phase's record. Create an addendum in the target phase instead." |
| 3 | Source phase has a summary file | **Hard block** | "Source phase is concluded. Archived artifacts cannot be migrated." |
| 4 | Target phase has a summary file | **Hard block** | "Target phase is concluded. Cannot add activities to a concluded phase." |
| 5 | Target phase already has a POC/session with the same number | **Warning** | "Phase [N] already has [type] [number]. Confirm the new number for the migrated activity before proceeding." Prompt for new number. |

## What happens

**Step 1 — Source phase writes**

1. Update POC roadmap row in source phase → `Migrated → Phase [target] — YYYY-MM-DD`
2. Update CONTENT_INDEX plan entry → append `[MIGRATED to Phase NN — YYYY-MM-DD]`
3. Append to log.md: `migrate | [activity] | Phase [src] → Phase [tgt]`

**Step 2 — Target phase writes**

4. Create new plan file under target phase naming: update `phase:` frontmatter field, filename, and `**Project root:**`; port all content from source plan. Do NOT re-run `/activity-new` from scratch — preserve all prior context in the plan.
5. Add row to target phase POC roadmap as `🔜 Planned`
6. Add entry to CONTENT_INDEX under target phase section
7. If activity carried open decisions in source tracker: surface them — ask whether to add to target phase decisions tracker

**Note:** Only the plan file is ported. Results and conclusions stubs are not created until work starts in the target phase.

## Output
| Action | File changed |
|--------|-------------|
| Source roadmap updated | `plans/phase-[src]-poc-roadmap.md` |
| Source CONTENT_INDEX entry updated | `CONTENT_INDEX.md` |
| New plan file created | `plans/phase-[tgt]-[type]-[id]-plan.md` |
| Target roadmap updated | `plans/phase-[tgt]-poc-roadmap.md` |
| Log entry appended | `log.md` |
