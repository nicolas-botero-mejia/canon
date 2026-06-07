# /activity-deprecate

Mark an activity as abandoned without conclusions: update plan frontmatter, clear roadmap and backlog entries, and log the decision.

## When to use
- An activity is no longer worth pursuing and will not produce conclusions
- A POC or research branch has been superseded before it started
- An addendum trigger has expired or been resolved by other means

## Arguments
- `type` (required): `poc` | `addendum` | `research` | `session`
- Activity identifier (required): e.g., `poc-02`, `addendum-01`, `research-chart-libraries`

## Fail-safes — evaluated in order, stop on first hit

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Conclusions file exists + `alignment_verified` set + decisions closed by this activity in tracker | **Hard block** | "Cannot deprecate — this activity has closed decisions that are part of the knowledge record. To extend or supersede, create an addendum." |
| 2 | CONTENT_INDEX status is `Complete` | **Hard block** | "Activity is marked Complete. Completed activities cannot be deprecated." |
| 3 | Source phase has a summary file (`conclusions/phase-NN-summary.md`) | **Hard block** | "Source phase is concluded. Archived phase artifacts cannot be deprecated." |
| 4 | Conclusions file exists but `alignment_verified` is empty | **Warning** | Ask: "A partial conclusions file exists without alignment verification. Confirm deprecation rather than conclusion of this activity?" |
| 5 | Downstream plans list this activity in their `## Prerequisites` table | **Warning** | Surface list: "These plans depend on this activity's outcome: [list]. Confirm they will also be updated or deprecated." |

## What happens

**Step 1 — PM confirms deprecation**
State the activity identifier and reason. Confirm: is this activity In Progress (has results content) or only Planned (plan file only, no results content)?

**Step 2 — Update plan file frontmatter**
Add to the plan file's YAML frontmatter:
```yaml
status: deprecated
deprecated_date: YYYY-MM-DD
deprecated_reason: [reason]
```

**Step 3 — Update results stub (if exists)**
If results stub exists: add `status: deprecated` to frontmatter.

**Step 4 — Handle partial conclusions**
If partial conclusions file exists: add `status: deprecated` to frontmatter.

**Addendum edge case:** An addendum's partial conclusions exist as an appended section in the parent file, not a standalone file. If the parent has a `## Addendum NN` section with no `**Addendum alignment verified:**` date, add `**Status: Deprecated YYYY-MM-DD — [reason]**` at the top of that section instead of adding frontmatter (sections do not have frontmatter).

**Step 5 — Update CONTENT_INDEX.md**
Append `[DEPRECATED YYYY-MM-DD — reason]` to all CONTENT_INDEX entries for this activity.

**Step 6 — Update POC roadmap**
`poc` and `addendum` types: update roadmap row status → `~~In Progress~~ Deprecated` (or `Deprecated` if activity was Planned).

**Step 7 — Update discovery backlog**
`addendum` type only: update `plans/discovery-backlog.md` entry status → `Deprecated — [reason] — YYYY-MM-DD`.

**Step 8 — Log**
Append to `log.md`: `deprecate | [activity-identifier] | [reason]`

## Output
| Action | File changed |
|--------|-------------|
| Plan frontmatter updated | `plans/phase-NN-[type]-[id]-plan.md` |
| Results stub updated (if exists) | `findings/phase-NN-[type]-[id]-results.md` |
| CONTENT_INDEX updated | `CONTENT_INDEX.md` |
| Roadmap updated | `plans/phase-NN-poc-roadmap.md` (poc/addendum only) |
| Backlog updated | `plans/discovery-backlog.md` (addendum only) |
| Log entry appended | `log.md` |
