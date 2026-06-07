# /phase-update

Make a surgical update to an active phase's index or roadmap: add/close decisions in the tracker, update the session map, modify the roadmap, or revise the phase scope statement.

## When to use
- A decision in the tracker needs to be added, closed, or deferred mid-phase
- A session needs to be added, removed, or rescheduled on the session map
- A POC row needs to be added or removed from the roadmap
- The phase focus statement needs to be revised

## Arguments
- Phase number (required): e.g., `01`
- What to update (required): `tracker` | `session-map` | `roadmap` | `scope`

## Fail-safes

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Phase summary file exists (`conclusions/phase-NN-summary.md`) | **Hard block** | "Phase is concluded. There is no active phase to update." |

## What happens

**Step 1 — PM confirms the change**
State what is being updated and why. For `tracker`: specify the decision text, new status, and supporting activity. For `roadmap`: specify the POC to add or remove. For `session-map`: specify session number and change. For `scope`: specify the new focus statement.

**Step 2 — Writer makes the surgical edit**
Edit only the targeted section:
- `tracker`: add, close (`Closed — [answer] — YYYY-MM-DD`), or defer (`Deferred — [reason] — YYYY-MM-DD`) a decision row in `plans/phase-NN-index.md §Decisions Tracker`
- `session-map`: update the session schedule table in `plans/phase-NN-index.md`
- `roadmap`: add or remove a POC row in `plans/phase-NN-poc-roadmap.md`
- `scope`: update the phase focus statement in `plans/phase-NN-index.md`

No other sections are touched.

**Step 3 — Update CONTENT_INDEX.md (material changes only)**
If the change materially affects the key facts documented for this phase (e.g., a phase-blocking decision closed, a POC added), update the CONTENT_INDEX key facts field.

**Step 4 — Log**
Append to `log.md`: `update | phase-[NN] | [what changed] — [reason]`

## Output
| Action | File changed |
|--------|-------------|
| Phase index or roadmap updated | `plans/phase-NN-index.md` or `plans/phase-NN-poc-roadmap.md` |
| CONTENT_INDEX updated (if material) | `CONTENT_INDEX.md` |
| Log entry appended | `log.md` |
