# /phase-new

Scaffold a new engagement phase — create the phase index, update CLAUDE.md and CONTENT_INDEX.md, and verify the transition is complete.

## When to use
At the START of a new phase, after the prior phase has been concluded via `/phase-conclude`. If `/phase-conclude` already ran `node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh`, this skill confirms the transition and updates documentation. If the transition script hasn't run yet, this skill runs it.

## Arguments
- `phase-number` (required): the new phase number to scaffold (e.g., `02`)

## Conceptual model
Phases are the engagement container. `/phase-new` opens the container; `/phase-conclude` closes it. Activities (`/activity-new [type]`) run inside. Phase operations stand apart from activity operations.

---

## What happens

**Step 1 — Confirm prerequisite**
Check: is the prior phase fully concluded?
- Does `output/phase-[N-1]-summary.md` exist? (written by `/phase-conclude`)
- Is the prior phase's POC roadmap fully ✅ Complete or explicitly deferred?
- Are all prior phase decisions Closed or Deferred in `plans/phase-[N-1]-index.md §Decisions Tracker`?

If any are incomplete: surface them and **STOP** — *"Prior phase has [N] unclosed items. Run `/phase-conclude [N-1]` first, or confirm explicit deferral before scaffolding the new phase."*

**Step 2 — Run phase transition script (if not already run)**
Check if the new phase index file already exists: `plans/phase-NN-index.md`
- If it does NOT exist: run `bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-transition.sh [prior-phase] [new-phase]`
  - This: archives current phase plans to `plans/_archive/phase-[N-1]/`, scaffolds new phase index from template, updates `CONTENT_INDEX.md` and `log.md`
- If it ALREADY exists (ran in `/phase-conclude`): skip and confirm the file is present.

**Step 3 — Update CLAUDE.md**
- Update the active phase reference in the Phase 1 Sessions table → new phase table
- Update the "Status" note
- Confirm CLAUDE.md remains under 200 lines (hard limit)

**Step 4 — Update CONTENT_INDEX.md**
- Add new phase section header (if not added by the transition script)
- Verify the new phase index file (`plans/phase-NN-index.md`) is registered

**Step 5 — Verification**
Confirm:
- `plans/phase-NN-index.md` exists and is registered in CONTENT_INDEX.md
- `plans/_archive/phase-[N-1]/` contains the archived prior phase plans
- `CLAUDE.md` reflects the new phase

**Step 6 — Log**
Append to `log.md`: `[date] create | plans/phase-NN-index.md | Phase [N-1] → Phase [N] scaffolded. Prior phase archived.`

---

## Output
- `plans/phase-NN-index.md` — new phase decisions tracker + session map (from template)
- `plans/_archive/phase-[N-1]/` — prior phase plans archived
- `CLAUDE.md` — updated active phase
- `CONTENT_INDEX.md` — new phase registered
