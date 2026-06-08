---
name: activity-update
description: Surgically revise an in-progress activity plan: update scope, hypotheses, or plan structure. Does not change status or produce conclusions.
compatibility: Claude Code
---
# /activity-update

Surgically revise an in-progress activity's plan: update scope, hypotheses, or plan structure. Does not change status or produce conclusions.

## When to use
- A POC's scope has changed since the plan was created
- Hypotheses need revision before results are filled
- Plan structure needs updating to reflect new constraints

## Arguments
- `type` (required): `poc` | `addendum` | `research` | `session`
- Activity identifier (required): e.g., `poc-02`
- What to update (required): `scope` | `hypotheses` | `plan`

## Fail-safes

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Conclusions file exists + `alignment_verified` set | **Hard block** | "Activity is concluded. Use `/activity-new addendum [parent-id]` to extend it." |
| 2 | Downstream plans list this activity | **Info** | Surface list: "These plans declare this activity as a prerequisite — review if the scope change affects their assumptions." |

## What happens

**Step 1 — PM confirms the change**
State what is changing and why. If hypotheses are changing: confirm which H-numbers are affected and what the new phrasing is.

**Step 2 — Writer makes surgical edits**
Edit the plan file only — add `**Revised:** YYYY-MM-DD — [reason]` note at the top of each changed section. No restructuring outside the targeted section.

**Step 3 — Flag downstream impact (hypotheses only)**
If hypothesis numbers changed: *"Results stub section headers reference H-numbers. Update them before filling results, or downstream confusion is likely."* Surface any sessions or downstream POC plans that reference the old hypothesis text.

**Step 4 — Roadmap unchanged**
POC roadmap status does not change — activity remains In Progress (or Planned if not yet started). No roadmap edit.

**Step 5 — Log**
Append to `log.md`: `update | [plan-file] | scope revision — [reason]`

## Output
| Action | File changed |
|--------|-------------|
| Plan file updated (surgical) | `plans/phase-NN-[type]-[id]-plan.md` |
| Log entry appended | `log.md` |
