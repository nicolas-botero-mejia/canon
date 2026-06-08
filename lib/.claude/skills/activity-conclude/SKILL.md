---
name: activity-conclude
description: Conclude a completed activity: synthesize results into conclusions, close decisions, update the tracker, register everything.
compatibility: Claude Code
---
# /activity-conclude

Conclude a completed activity: synthesize results into conclusions, close decisions, update the tracker, register everything.

## When to use
After an activity's results file is complete — all steps executed, raw observations recorded, hypothesis resolution table filled (poc/addendum), or research sections complete (research), or session ended (session).

## Arguments
- `type` (required): `poc` | `addendum` | `research` | `session`
- Results file path (optional): specify directly if ambiguous

## Conceptual model
`/activity-conclude [type]` closes the activity lifecycle started by `/activity-new [type]`. The `session` type is a checkpoint (no conclusions file written — results stub + decisions tracker update only). All other types produce a conclusions file and set `**Alignment verified:**`.

After concluding, run `/conclusions-review` on the conclusions file to verify system alignment (or it will be checked at session-end by the stop hook).

---

## What happens

**Step 1 — Load context**
Load in priority order:
1. The completed results file (`findings/phase-NN-[type]-[name]-results.md`)
2. Overlapping prior conclusions relevant to this activity's topic
3. `addendum`: also load the parent conclusions file — what the parent proved, what's deferred, which H-numbers this addendum extends
4. `session`: also load field-notes file if it exists

Returns a context brief: what the results prove, which deferred observations from prior work are now resolved, what new deferred observations this activity surfaces.

**Step 2 — Synthesize conclusions**

Type-specific output:

**`poc`** — fill `poc.conclusions-template.md` (or the stub created by `/activity-new poc`):
- File: `conclusions/phase-NN-poc-NN-[name]-conclusions.md`
- Required sections: Verdict (1–2 sentences), H1–HN blocks (Status / Finding / Decision / Wiki update), Evidence Summary (key raw observations per hypothesis), Deferred Observations, Decisions Closed, Wiki Files Updated, Addendum Candidates

**`addendum`** — append a new section to the existing parent POC conclusions file:
- File: `conclusions/phase-NN-poc-NN-[parent-name]-conclusions.md` (the EXISTING parent file — do not create a new file)
- **Fail-safe:** If parent conclusions file is not found → hard stop: *"Parent conclusions file not found: [path]. Cannot append addendum section to a non-existent file. Conclude the parent POC first."*
- **Backward compatibility:** If the parent file has a `## Addendums` section: append the block after it. If not: add the `## Addendums` placeholder at end of file first, then append the block.

Append block structure:
```markdown
---

## Addendum NN — [slug]

**Source:** `findings/phase-NN-[parent]-addendum-NN-[slug]-results.md`
**Synthesis date:** YYYY-MM-DD
**Addendum alignment verified:** YYYY-MM-DD

> H-numbers continue from parent (H8+). Parent hypotheses H1–H7 remain valid unless
> listed in Decisions Revised below.

### H8 — [Hypothesis Title]
**Status:** CONFIRMED / REFUTED / PARTIAL REFUTATION
**Finding:** ...
**Decision:** ...
**Wiki update:** ...

### Evidence Summary — Addendum NN
> [Key evidence per hypothesis]

### Decisions Revised — Addendum NN
| Decision | Parent verdict | Revised verdict | Reason |

### Deferred Observations — Addendum NN
- ...
```

- Required content: same as poc PLUS:
  - **Tracker Delta** — compare tracker state TODAY vs. at the parent's conclusion date. List every decision that opened, closed, or was revised between the parent's synthesis date and now. This is the primary safeguard against context drift when an addendum extends old work through multiple rounds of POCs.
  - Decisions Revised / Decisions Unchanged (replaces Decisions Closed from poc format)

**`alignment_verified` handling:** Section-level `**Addendum alignment verified:**` date is set when `/conclusions-review` or `/activity-conclude addendum` verifies the appended section. The file-level `**Alignment verified:**` date (top of file) reflects the last full top-to-bottom review. Both can exist independently.

**CONTENT_INDEX change:** Parent conclusions entry gains `**Addendums incorporated:** 01, 02, …` field. No separate addendum-conclusions CONTENT_INDEX entries.

**`research`** — fill `research.conclusions-template.md`:
- File: `conclusions/phase-NN-research-[topic]-conclusions.md`
- **Optional** — only create when this research closes a tracked decision. If research only produces findings (no decision closes), run this skill to update CONTENT_INDEX status entries for plan + results from "In Progress" → "Complete" and set the Alignment Verified field on the results file.
- Required sections (when conclusions file is written): Research Verdict, Key Findings, Decisions Closed, Deferred Observations, Wiki Files Updated

**`session`** — **checkpoint only, no conclusions file**:
- Create results stub (`session.results-template.md`): `findings/phase-NN-session-NN-[topic]-results.md`
- This file is NOT filled now — it waits for the transcript to arrive in `raw/`
- Flag: *"Session results stub created — fill when transcript arrives in `raw/phase-NN-session-NN-[topic]-transcript.md`."*

**Step 3 — PM closes decisions**
- `poc`, `addendum`, `research`: extract Decisions Closed (or Decisions Revised) table → update `plans/phase-NN-index.md §Decisions Tracker` with format `Closed — [answer] — [type] NN, YYYY-MM-DD`
- `session`: prompt — *"Which decisions were confirmed in this session? For each, what was the answer?"* → update tracker with `Closed — [answer] — Session NN, YYYY-MM-DD`

If no decisions were confirmed: note explicitly — *"Activity NN closed with no decisions confirmed. [N] open decisions remain."*

**Step 4 — Flag deferred observations + retired tools**

`poc` and `addendum` — full check:
- For each item in `## Deferred Observations`: does a `plans/discovery-backlog.md` entry exist? Is its status current?
- **Tool retirement check**: scan hypothesis verdicts for tools being officially removed from the stack (keywords: "removed from stack", "superseded by", "REFUTED", "no longer in use"). If found: *"⚠️ Tool retirement detected: [tool]. Add pattern to `node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-stale-refs.sh` before closing."* Confirm the pattern was added.
- Surface connections to upcoming sessions or POC plans that should be updated given this activity's verdicts.

`research` — lighter check:
- Deferred observations only (no tool retirement check)

`session` — observation surface:
- Surface any key observations from field-notes or session notes that should feed the backlog or upcoming session plans.

**Signal check (all types):**
"Did anything unexpected surface during this activity that:
 - Connects patterns across multiple prior activities?
 - Challenges an assumption in a wiki file or prior conclusion?
 - Feels important but doesn't fit any hypothesis in this activity?

If yes → run `/signal <slug>` before closing. Takes 2 minutes. Prevents the insight from being lost.
If no → proceed to Step 5."

This is advisory, not blocking. Human decides.

**Step 5 — Register, verify, log**

> ✅ Verification gate: Before setting Alignment Verified, confirm:
> - The conclusions file (poc/research) OR parent §Addendum NN section (addendum) OR results stub (session) appears in `CONTENT_INDEX.md`
> - All linked plan + results files also appear in `CONTENT_INDEX.md`
> - The POC roadmap row is updated to ✅ Complete (poc and addendum types)
> - Parent conclusions file has the appended `## Addendum NN` section (addendum type only)
> Do not set Alignment Verified or close this step until all items are confirmed.

- Update `CONTENT_INDEX.md` — conclusions file entry (update status from In Progress → Complete)
- Update `plans/phase-NN-poc-roadmap.md` (poc and addendum: → ✅ Complete)
- Update `plans/discovery-backlog.md` entry status (addendum: → Complete)
- **Set alignment fields** on the conclusions file (poc/addendum/research types only — NOT session):
  - Body: `**Alignment verified:** YYYY-MM-DD`
  - YAML frontmatter: `alignment_verified: "YYYY-MM-DD"` (MCP reads the YAML field; body-only leaves MCP reporting the file as unverified)
- Append to `log.md`

---

## Output by type

| Type | Primary output | Decisions updated | Alignment Verified |
|------|---------------|------------------|--------------------|
| `poc` | `conclusions/.../conclusions.md` | ✅ | ✅ |
| `addendum` | parent POC conclusions file §Addendum NN (appended) | ✅ | ✅ (section-level `**Addendum alignment verified:**`) |
| `research` | `conclusions/.../conclusions.md` (optional) | ✅ if decisions close | ✅ on conclusions or results |
| `session` | `findings/.../results.md` (stub) | ✅ | ❌ (set when transcript fills results) |

## What comes next
- `poc`, `addendum`, `research`: run `/conclusions-review [conclusions-file]` to verify full system alignment (or it fires automatically at session-end via the stop hook).
- `session`: when the transcript arrives in `raw/`, fill the results stub. Then run `/activity-conclude session` again (or manually synthesize session conclusions) to produce a `session.conclusions-template.md` file — then run `/conclusions-review`.
