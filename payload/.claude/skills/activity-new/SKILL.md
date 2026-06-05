# /activity-new

Create all planning artifacts for a new activity inside the current phase.

## When to use
Before starting any new activity — session, POC, research, or addendum. Creates the plan and stub files pre-loaded with prior context so work is grounded in what's already confirmed.

## Arguments
- `type` (required): `poc` | `addendum` | `research` | `session`
- Type-specific identifiers (required):
  - `poc`: POC number (e.g., `03`) + name slug (e.g., `code-to-figma`)
  - `addendum`: parent identifier (e.g., `poc-01`) + addendum number (e.g., `01`) + slug (e.g., `token-category-architecture`)
  - `research`: topic slug (e.g., `chart-libraries`)
  - `session`: session number (e.g., `07`) + optional topic slug (e.g., `architecture-workshop`)
- Phase (optional): defaults to current active phase

## Conceptual model
Activities are bounded units of work inside a phase. Four types share the same lifecycle: `new → in progress → concluded`. This skill starts the lifecycle. `/activity-conclude [type]` closes it.

---

## What happens

**Step 0 — Pre-flight guard**
- `poc` and `session`: check whether artifacts for this number already exist:
  - `poc`: `plans/phase-NN-poc-NN-*-plan.md`, `findings/phase-NN-poc-NN-*-results.md`, `output/phase-NN-poc-NN-*-conclusions.md`
  - `session`: `plans/phase-NN-session-NN-*-plan.md`
  - If any exist: **STOP and ask the user** (Rule 13). Report which files exist. Ask whether the user intended a different number, an addendum, or an explicit overwrite. Do not proceed until intent is clear.
- `addendum`: check `plans/discovery-backlog.md` — does an entry exist for this trigger? If not: *"Is this addendum triggered by a backlog entry? If not, should it be added first?"*
- `research`: no guard — research may be started without a backlog entry.

**Step 1 — PM confirms trigger + decision context**
- `poc`: read `plans/phase-NN-poc-roadmap.md` + `plans/phase-NN-index.md §Decisions Tracker`. Report: which tracked decisions this POC is expected to inform or close; which POC is the prerequisite; whether the prerequisite is complete.
- `addendum`: read parent conclusions file first (mandatory). Report: what the parent proved (H1–HN); what was deferred (addendum candidates); the next H-number (continuing parent numbering); any prior addendums for this parent. Also check tracker: which decisions does this addendum affect?
- `research`: confirm this answers a tracked open decision (note which one) or documents a named gap. Prevent research for its own sake.
- `session`: read `plans/phase-NN-index.md §Decisions Tracker`. Report: all open decisions this session should close; which are phase-blocking (★); current gate status.

**Step 2 — Prior context check**
- `poc`: check for prior research on this topic (advisory if missing — suggest `/activity-new research` first if hypothesis space is unclear)
- `addendum`: parent conclusions already loaded in Step 1. Check for prior research on the addendum topic — it may resolve hypotheses before execution.
- `research`: search `CONTENT_INDEX.md` for existing research on the same or closely related topic. If found, surface it: *"Prior research found on [topic]. Does new research still add value, or can we build on what exists?"*
- `session`: load prior conclusions relevant to this session's topic. For each conclusions file depended on: check `**Alignment verified:**` field (Rule 12). If absent: surface it — *"[file] has not been alignment-verified. Run `/activity-conclude poc` or `/conclusions-review [file]` before creating this plan, or confirm inline."* Do not block — surface and let human decide.

**Step 3 — Load prior context brief**
For all types: load relevant conclusions, deferred observations, wiki sections in priority order (conclusions > results > field-notes). Return structured brief:
- What's already proven — do not re-test
- What's open or deferred — these become hypotheses or questions
- What prior addendums already addressed (addendum type)

**Step 4 — Writer creates plan file**
Using the template for the activity type:
- `poc`: `poc.plan-template.md` → `plans/phase-NN-poc-NN-[name]-plan.md`
- `addendum`: `addendum.plan-template.md` → `plans/phase-NN-[parent-id]-addendum-NN-[slug]-plan.md`
- `research`: `research.plan-template.md` → `plans/phase-NN-research-[topic]-plan.md`
- `session`: `poc.plan-template.md` (adapted for sessions per `wiki/meta/system-maintenance.md §9`) → `plans/phase-NN-session-NN-[topic]-plan.md`

Pre-populate with:
- `**Project root:**` — absolute path to this project (fill at creation time)
- Context from Step 3: what's proven (don't re-test), deferred observations, prior addendum verdicts
- `poc`, `addendum`: hypotheses derived from deferred observations + open decisions; "Already proven" section
- `session`: open decisions as required questions (★ for phase-blocking)
- All types: `## Prerequisites` checklist with escalation protocol — *"If any prerequisite above cannot be satisfied, stop and ask the user before proceeding. Do not attempt workarounds."*
- `poc`, `addendum`: `## Downstream Dependencies` table — list POC/session plans that depend on this activity's outcome. If none: "None identified." Never leave blank.

**Step 5 — Writer creates stub files**
- `poc`: results stub (`poc.results-template.md`) + conclusions stub (`poc.conclusions-template.md`, Status: In Progress)
- `addendum`: results stub (`addendum.results-template.md`) + conclusions stub (`addendum.conclusions-template.md`, Status: In Progress, H-numbers continuing from parent)
- `research`: results stub only (`research.results-template.md`) — no conclusions stub (conclusions are optional for research, created only when a decision closes)
- `session`: field-notes stub only (`session.field-notes-template.md`, Author: Human) — no results stub, no conclusions stub

**Step 6 — Register, verify, log**

> ✅ Verification gate: Before logging, confirm every file created in this step appears in `CONTENT_INDEX.md` by searching for each filename. Confirm the POC roadmap row is added or updated (poc and addendum types). Do not close this step until all entries are confirmed present.

- Add all created files to `CONTENT_INDEX.md`
- `poc`: update `plans/phase-NN-poc-roadmap.md` status (→ In Progress or 🔜 Next)
- `addendum`: update `plans/phase-NN-poc-roadmap.md` — add addendum row; update `plans/discovery-backlog.md` entry (→ In Progress)
- Append to `log.md`

---

## Output
| Type | Files created |
|------|--------------|
| `poc` | Plan + results stub + conclusions stub (3 files) |
| `addendum` | Plan + results stub + conclusions stub (3 files) |
| `research` | Plan + results stub (2 files) |
| `session` | Plan + field-notes stub (2 files) |

## What happens after execution
When the activity results file is complete: run `/activity-conclude [type]`.
