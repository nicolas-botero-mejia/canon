---
name: phase-reorder
description: Swap the numbers of two active phases: rename all associated files, update internal references, and log the swap.
compatibility: Claude Code
---
# /phase-reorder

Swap the numbers of two active phases: rename all associated files, update internal references, and log the swap. Uses a three-step atomic rename to avoid collisions.

## When to use
- Two phases need to be reordered before either is concluded
- A phase planned as phase-03 should logically run before phase-02

## Arguments
- Phase A number (required): first phase to swap, e.g., `02`
- Phase B number (required): second phase to swap, e.g., `04`

## Fail-safes

| # | Condition | Severity | Response |
|---|-----------|----------|----------|
| 1 | Either phase has a summary file (`conclusions/phase-NN-summary.md`) | **Hard block** | "Phase [N] is concluded. Concluded phases cannot be renumbered — audit trails are tied to the original number." |
| 2 | Either phase has a `plans/_archive/phase-NN/` directory | **Hard block** | "Phase [N] has an archive directory. Renaming would break the archive trail." |
| 3 | In-progress activities exist in either phase | **Warning** | "Renaming will change filenames of all in-progress work files. Confirm this is intentional." |
| 4 | CLAUDE.md references either phase number | **Info** | "CLAUDE.md references phase [N] — this will be updated automatically." |

## What happens

**Step 1 — Dry run first**
Run `bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-reorder.sh [A] [B] --dry-run` and surface the full rename list for human review. Do not proceed until the human approves the rename plan.

**Step 2 — Execute**
On approval, run `bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/phase-reorder.sh [A] [B]`.

The script performs a three-step atomic swap:
1. Rename all `phase-A-*` files → `phase-tmp-*`
2. Rename all `phase-B-*` files → `phase-A-*`
3. Rename all `phase-tmp-*` files → `phase-B-*`
4. Update internal `phase-NN` references in all renamed files (excluding log.md)
5. Update CONTENT_INDEX.md section headers
6. Update CLAUDE.md phase reference if active
7. Append log entry

Scope: `plans/`, `findings/`, `conclusions/` only. `plans/_archive/` is read-only — blocked by fail-safe 2.

**Step 3 — Post-run checks**
Run `check-index.sh` and `check-links.sh`. Surface any remaining broken references.

**Step 4 — Log**
Historical `log.md` entries are NOT modified — the log is append-only. The script appends a new entry: `reorder | phase-[A] ↔ phase-[B] | [reason]`. Historical entries remain accurate to when they were written.

## Output
| Action | Files changed |
|--------|--------------|
| All `phase-A-*` files renamed to `phase-B-*` | `plans/`, `findings/`, `conclusions/` |
| All `phase-B-*` files renamed to `phase-A-*` | `plans/`, `findings/`, `conclusions/` |
| Internal references updated | All renamed files |
| CONTENT_INDEX section headers updated | `CONTENT_INDEX.md` |
| CLAUDE.md updated (if applicable) | `CLAUDE.md` |
| Reorder entry appended | `log.md` |
