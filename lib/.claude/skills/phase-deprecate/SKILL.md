# /phase-deprecate

Deprecate an active phase that will not be concluded: resolve open decisions, handle in-progress activities, archive plans, and log the decision.

## When to use
- A phase's scope is being abandoned entirely before conclusion
- The project direction changed and the phase's work will not be incorporated into the knowledge record

## Arguments
- Phase number (required): e.g., `02`
- Reason (required): why this phase is being deprecated

## Fail-safes

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Phase summary file exists (`conclusions/phase-NN-summary.md`) | **Hard block** | "Phase is concluded. Concluded phases cannot be deprecated." |
| 2 | Any activity in this phase has closed decisions in the tracker | **Hard block** | "Phase has [N] activities that closed decisions: [list]. Their outputs are part of the knowledge record and cannot be deprecated." |
| 3 | Any concluded activity's conclusions are cited in wiki files (via check-links.sh scan) | **Hard block** | "Activity [X] is cited in [wiki-file]. Deprecating this phase would orphan those references. Update the wiki file first." |
| 4 | Open decisions exist in tracker | **Gate** | List each open decision. Require explicit deferral reason per decision before proceeding: `Deferred — [reason] — Phase deprecated YYYY-MM-DD` |
| 5 | In-progress activities exist | **Decision gate** | For each: "Activity [X] is In Progress. Choose: (a) deprecate it — abandons all work, or (b) migrate it — specify target phase." Human decides per activity. |

## What happens

**Step 1 — Resolve in-progress activities**
For each in-progress activity: execute `/activity-deprecate` or `/activity-migrate` per user decision from the gate above. Do not proceed until all in-progress activities have an explicit fate.

**Step 2 — Close open decisions**
Update all open tracker decisions to Deferred with reason:
`Deferred — [reason] — Phase deprecated YYYY-MM-DD`

**Step 3 — Archive phase plans**
Archive all `plans/phase-NN-*.md` files to `plans/_archive/phase-NN/`. This is the same operation as `phase-transition.sh` Step 1.

**Step 4 — Update CONTENT_INDEX.md**
Append `[DEPRECATED YYYY-MM-DD — reason]` to all CONTENT_INDEX entries for this phase.

**Step 5 — Update CLAUDE.md**
If CLAUDE.md references this phase as active, update the reference to reflect the deprecation.

**Step 6 — Log**
Append to `log.md`: `deprecate | phase-[NN] | [reason]`

## Output
| Action | File changed |
|--------|-------------|
| In-progress activities resolved | Per `/activity-deprecate` or `/activity-migrate` outputs |
| Open decisions deferred | `plans/phase-NN-index.md §Decisions Tracker` |
| Plans archived | `plans/_archive/phase-NN/` |
| CONTENT_INDEX updated | `CONTENT_INDEX.md` |
| CLAUDE.md updated (if applicable) | `CLAUDE.md` |
| Log entry appended | `log.md` |
