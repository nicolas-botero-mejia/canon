# System Maintenance — CLAUDE.md and the Knowledge Base

**Last updated:** 2026-06-02 (session 2 — content rules, move action type, Rule 15 functional test note; §4 wiki-manage sub-commands aligned + hook-surface bullet added via meta-doc currency check)
**Scope:** How to maintain the CLAUDE.md, wiki, plans, findings, output, and index over the life of the project. This is the implementation; CLAUDE.md is the interface.

> **Why this exists:** CLAUDE.md needs to stay lean (under 200 lines) to avoid burdening the context window every session. The rules for maintaining it, the decisions about what belongs where, and the principles for pruning stale content live here — not there.

---

## Table of Contents

1. [The Knowledge Architecture](#1-the-knowledge-architecture)
2. [The Three-Layer Model — raw → findings → output](#2-the-three-layer-model)
3. [Comparison with Karpathy's LLM Wiki Pattern](#3-comparison-with-karpathys-llm-wiki-pattern)
4. [What Lives Where — Full Reference](#4-what-lives-where--full-reference)
5. [Naming Convention](#5-naming-convention)
6. [How to Maintain CLAUDE.md](#6-how-to-maintain-claudemd)
7. [How to Maintain the Wiki](#7-how-to-maintain-the-wiki)
8. [How to Maintain the Index](#8-how-to-maintain-the-index)
9. [How to Maintain Plans](#9-how-to-maintain-plans)
10. [How to Use findings/ and output/](#10-how-to-use-findings-and-output)
11. [How to Maintain log.md](#11-how-to-maintain-logmd)
12. [Pruning Stale Content](#12-pruning-stale-content)
13. [The 6-Month Horizon Test](#13-the-6-month-horizon-test)
14. [Trigger Events — When to Update What](#14-trigger-events--when-to-update-what)

---

## 1. The Knowledge Architecture

```
CLAUDE.md  (the interface)
├── Read every session — must stay lean (under 200 lines)
├── Contains: confirmed facts, folder map, session context
├── Behavioral rules → `.claude/rules/behavioral.md` (auto-loaded each session)
├── Points to other files — never duplicates content
└── Updated only when confirmed facts change

wiki/ plans/ findings/ output/ raw/ log.md  (the implementation)
├── Not read every session — read on demand
├── Contains: depth, synthesis, research, maintenance rules (this file)
└── Organized by type — see the three-layer model below
```

---

## 2. The Three-Layer Model

Validated against Karpathy's LLM Wiki pattern (2026) and ResearchOps / Atomic Research best practices. Every project file belongs to one of three knowledge layers:

```
raw/
  What you RECEIVE. Immutable. Authored by others. Never edit.
  → Client documents, manager briefs, session transcripts, third-party materials.

findings/
  What you DISCOVER through your own work. Authored by the team. Can be refined.
  → Four types: poc-results, research-results, field-notes, handoff (see §4 and §10).
  → Different from raw: you generated it.
  → Different from output: not yet synthesized.

output/
  What you SYNTHESIZE from findings. Conclusions and deliverables.
  → Session conclusions, discovery synthesis, phase deliverables, component specs.

tmp/
  Transient project management files. NOT a knowledge layer.
  → Audits, status trackers, coverage checks — anything with a lifecycle condition.
  → Each file has a "Closes when:" condition. Librarian monitors; human approves deletion.
  → Not indexed by check-index.sh. Not referenced from wiki/, findings/, or output/.
```

**The key distinction:** "Unanalyzed" ≠ "raw." Session notes are unanalyzed but they are not raw — you authored them, they reflect your judgment, they can be cleaned up. A transcript is raw. A client document is raw. Your observations from watching someone use a product are *findings*.

**The authorship distinction within findings/:** Field notes are human-authored primary source (interpret, don't cite). Results are AI-structured evidence (citable in conclusions). Both live in findings/ but serve different roles in synthesis.

### Where wiki and plans fit

```
wiki/       → Stable reference knowledge — synthesized and persistent across sessions.
              Not raw, not findings, not output — it's the knowledge base that compounds.

plans/      → Engagement planning — agendas, question lists, decisions tracker, risk register.
              Living documents, updated continuously as the engagement progresses.

log.md      → Append-only project ledger. Every significant change recorded here.
```

---

## 3. Comparison with Karpathy's LLM Wiki Pattern

Karpathy's original structure:

```
raw/        → All ingested material. Append-only. Never edited.
              Includes meeting notes — treated as source material for LLM synthesis.

wiki/       → LLM-maintained structured knowledge.
              index.md, log.md, concepts/, entities/, sources/

outputs/    → Query responses, synthesized reports, analysis results.
```

**Where we align:**
- `raw/` as immutable, append-only source material
- `wiki/` with `index.md` and `log.md` as the navigation layer
- `CLAUDE.md` as the behavioral schema (his "system prompt config")
- Synthesis compounds over sessions rather than rediscovered from scratch each time

**Where we extend Karpathy — and why:**

| Karpathy | Us | Why we differ |
|----------|----|--------------|
| Meeting notes → `raw/` | Team notes → `findings/` | We're a team, not a solo user. Team-generated observations are a distinct artifact class — authored, revisable, accountable. Mixing them with immutable source material creates ambiguity. |
| No `findings/` layer | `findings/` between raw and output | ResearchOps and Atomic Research validate this distinction. The "observed" layer (team-generated data) is genuinely different from both received material and synthesized conclusions. |
| No `plans/` | `plans/` alongside wiki | Karpathy has no client engagement to plan for. |
| `outputs/` covers all synthesis | `output/` for conclusions; `wiki/` for stable reference | We distinguish between session conclusions (temporary, phase-specific) and stable reference knowledge (permanent, reusable across projects). |

Karpathy's model is optimized for a **personal knowledge base** — one person ingests, one LLM synthesizes. Our model is a **team engagement** — multiple contributors, client-facing accountability, multiple design process phases that need distinct artifact types.

---

## 4. What Lives Where — Full Reference

### CLAUDE.md
✅ Belongs: Project identity, folder map, confirmed client facts, current session context, behavioral rules (principle level only), pointers to wiki/plans.
❌ Never: Research content, maintenance rules, session detail, explanations of why rules exist, unconfirmed TBDs.
❌ Never: Decision summaries or phase-blocking lists — those belong in `plans/phase-01-index.md §Decisions Tracker`. CLAUDE.md points to the decisions tracker; it does not summarize it.

### wiki/standards/
✅ Belongs: Industry-wide best practices, non-client-specific research, patterns reusable across any engagement.
❌ Never: Client decisions, session-specific findings, living engagement artifacts.

### wiki/project/
✅ Belongs: Client-specific decisions — what was chosen, what version, what the constraint is, and what it means for the build. Decisions reference findings/ or standards/ for rationale; they do not contain it.
⚠️ **Living wiki exception:** Unlike standards/, updated as session decisions close. Note update date in header and log.md.

**Content rules — what belongs vs. what does not:**

| Belongs in wiki/project/ | Does NOT belong — goes here instead |
|--------------------------|-------------------------------------|
| Decision: what was chosen, what version, what constraint | Why a choice is industry-standard → wiki/standards/ or pointer |
| Tool name + role (current stack only) | Full API docs for a removed tool → findings/results or delete |
| Decision status (⏳ / ⚡ / ✅) + pointer | Planning stubs with no content → plans/ |
| One-sentence rationale with a link | POC Findings Summary sections → findings/ (already there) |

The clean pattern: a `wiki/project/` decision file where each section is a decision + status + pointer — no research history, no justification paragraphs, no duplication.

### wiki/meta/
✅ Belongs: How we work (prompting, AI workflow), how we maintain this system (this file).

### plans/
✅ Belongs: Session guides, question lists, decisions tracker, risk register, corrections log, session notes placeholder.
❌ Never: Stable industry research (→ wiki/standards/), things true of any engagement.

### findings/
✅ Belongs: Four file types, each with its own suffix, template, and authorship rule:

| Type | Suffix | Author | Template | When |
|------|--------|--------|----------|------|
| **POC results** | `-results.md` | AI | `poc.results-template.md` | During/after POC execution |
| **Addendum results** | `-results.md` | AI | `addendum.results-template.md` | During/after addendum execution — new hypotheses only; extends any closed parent (POC, research, or session) |
| **Signal results** | `-results.md` | AI | `signal.results-template.md` | When an external discovery has no parent doc — assessment artifact, routes to action |
| **Research results** | `-results.md` | AI | `research.results-template.md` | After completing a research plan |
| **Session results** | `-results.md` | AI | `session.results-template.md` | After a session, once transcript is available |
| **Field notes** | `-field-notes.md` | Human | `session.field-notes-template.md` | During/after a session — personal, informal |
| **Handoff** | `-handoff.md` | AI | `handoff.results-template.md` | Between phases or POCs |

All files carry `**Author:** Human | AI | Mixed`

❌ Never: Transcripts (→ raw/), synthesized conclusions (→ output/), transient working files (→ tmp/).

### raw/
✅ Belongs: Client/manager documents, session transcripts (verbatim), third-party source material received.
❌ Never: Anything the team authored — even if unanalyzed, team-generated content goes to findings/.
**Never edit files in raw/.**

### output/
✅ Belongs: Session conclusions, phase synthesis, formal deliverables (component specs, architecture briefs, design system docs, final recommendations).
❌ Never: Raw observations (→ findings/), received material (→ raw/).

### tmp/
✅ Belongs: Transient project management files — audits, status trackers, coverage checks, working notes with a defined lifecycle.
Each file requires: `**Created:** YYYY-MM-DD` and `**Closes when:** [specific condition]`
❌ Never: Knowledge resources, content referenced from wiki/, findings/, or output/.
❌ Never: Files without a Closes When condition — every tmp file must have an exit.
Not indexed by check-index.sh. Not linked from other project files.

### .claude/
✅ Belongs: Project-level agent definitions (`agents/`), skill definitions (`skills/[name]/SKILL.md`), behavioral rules (`rules/`), hook configuration (`settings.json`), out-of-session change sentinel (`pending-updates.log`).
❌ Never: Knowledge content, findings, plans, or output files — nothing that belongs in the monitored knowledge layers.

**Separation of concerns within `.claude/`:**
- `agents/` → specialized subagent definitions (Librarian, PM, Writer)
- `skills/` → invocable skills (`/skill-name`); each skill lives in its own `[name]/SKILL.md` subdirectory; **Phase:** `/phase-new`, `/phase-conclude` | **Activity:** `/activity-new [type]`, `/activity-conclude [type]` | **System:** `/wiki-manage` (add/update/deprecate/move), `/knowledge-audit`, `/conclusions-review`
- `rules/` → behavioral rules that load automatically each session; currently one file (`behavioral.md`)
- `settings.json` → hook configuration spanning SessionStart, PostToolUse (stale-ref pre-check on Write/Edit), and Stop (4-script consistency chain) — full detail in `architecture.md §2`
- `CLAUDE.md` → confirmed project facts, folder map, navigation guide, session table only — no rules

**When to add a rule vs. update CLAUDE.md:** If the content governs *how Claude should act*, it belongs in `.claude/rules/`. If it is a confirmed project *fact*, it belongs in `CLAUDE.md`.

### wiki/meta/system-architecture.md and wiki/meta/system-operations.md
These two files are the system's source of truth — not regular wiki files. Any structural change (new folder, naming convention, new template type, new process type, new behavioral rule) requires updating both in the same session. See CLAUDE.md Rule 10.

---

## 5. Naming Convention

**Full pattern: `phase-NN-[process-type]-[identifier]-[file-type].md`**

Every file encodes: which phase, what kind of process, what it's about, and what type of document it is. This makes files scannable in any context without navigating folder hierarchies.

```
Phase prefix:   phase-NN-       (two digits: phase-01, phase-02, ...)
Process types:  poc-NN          Proof of concept (numbered, sequential)
                [parent-id]-addendum-NN  Addendum to any closed parent (POC, research, or session); [parent-id] = parent's own identifier segment (e.g. poc-02, research-mcp-landscape, session-04)
                signal-NN       External discovery with no parent (numbered per phase)
                research        Research effort (topic-based, not numbered)
                session-NN      Client or internal session (numbered)
                handoff         Transitional document between phases/POCs
File types:     plan            Session/POC/addendum/research guide (→ plans/)
                results         Structured execution log (→ findings/)
                field-notes     Human personal observations (→ findings/)
                conclusions     Synthesized output (→ output/)
                handoff         Transitional synthesis (→ findings/)
```

**In practice:**
```
findings/
  phase-01-poc-01-token-pipeline-results.md       ← POC execution log
  phase-01-research-platform-overview-results.md  ← research results
  phase-01-session-01-kickoff-field-notes.md      ← human personal notes
  phase-01-handoff-poc-01-to-poc-02.md            ← transitional doc

raw/
  phase-01-session-01-kickoff-transcript.md       ← verbatim, immutable

output/
  phase-01-poc-01-token-pipeline-conclusions.md
  phase-01-session-01-kickoff-conclusions.md
  phase-01-research-platform-overview-conclusions.md  ← only when closes a decision

plans/
  phase-01-index.md                               ← phase index (no process prefix)
  phase-01-poc-01-token-pipeline-plan.md
  phase-01-session-01-kickoff-plan.md
  phase-01-research-platform-overview-plan.md
  phase-02-index.md                               ← when Phase 2 starts
```

**Template naming:** `[process-type].[file-type]-template.md` — process-first. Full map → `wiki/meta/templates/template-index.md`.

**Subdirectories vs. prefixes:** Use prefixes (flat) for findings/, output/, plans/. Use subdirectories only for wiki/ where content types are genuinely different.

---

## 6. How to Maintain CLAUDE.md

### When to update
| Trigger | What to update |
|---------|---------------|
| Early client sessions | Confirmed decisions those sessions close (per the session plans) |
| New active plan or phase | Update plans/ pointer |
| Scope change | Scope, timeline, component count |

### What NOT to update CLAUDE.md for
Research findings, session detail, prompting principles, maintenance instructions, unconfirmed TBDs.

### The 200-line rule
If CLAUDE.md exceeds 200 lines, audit for: research content, explanatory paragraphs, session detail that belongs in plans, resolved decisions still listed.

---

## 7. How to Maintain the Wiki

### Adding a new wiki file
1. Check index — does it duplicate something existing?
2. Place in correct subdirectory: standards/ (industry), project/ (client-specific), meta/ (methodology)
3. Use standard header: title, last updated date, scope statement, "why this exists" note
4. Add to `CONTENT_INDEX.md` immediately
5. Add a `log.md` entry

### What makes a good wiki file
- Answers questions you haven't asked yet
- Has a clear scope statement and a "why this exists" note
- Doesn't restate what's in other files (link instead)
- Passes the 6-month horizon test (see Section 13)

---

## 8. How to Maintain the Index

The index is the system entry point. If it's stale, everything degrades.

### Per-file entry format
```markdown
### [subdirectory/filename.md](./subdirectory/filename.md)
**What it is:** One sentence scope description.

**Key facts:**
- Specific, citable — not vague topic names
- Numbers, thresholds, decisions

**Questions it answers:**
- Phrased as actual questions
```

### Key facts test
Specific enough that someone doesn't need to open the file. Bad: "Covers accessibility." Good: "WCAG 2.2 AA is the current target; EAA in enforcement since June 2025; automated tools catch only 30–35% of issues."

### When to update
- New wiki file created → add entry immediately
- wiki/project/tech-stack.md updated → refresh key facts
- Plan superseded → update plans section
- Monthly → quick pass for accuracy

---

## 9. How to Maintain Plans

### After each session
1. Open `plans/phase-0N-index.md` for the active phase
2. Update decisions tracker: `Closed — [answer] — Session N, YYYY-MM-DD`
3. Update risk register if anything materialized or resolved
4. Add brief session notes to the Session Notes section (full notes → findings/)
5. Update CLAUDE.md confirmed facts if anything definitively closed

### Post-session file workflow
```
Before session:  findings/phase-NN-session-NN-[topic]-field-notes.md   ← human fills during session
                 plans/phase-NN-session-NN-[topic]-plan.md             ← created by /activity-new session

Same day:        plans/phase-NN-index.md  (decisions tracker — update immediately)
                 CLAUDE.md  (confirmed facts only, if any closed)

When transcript available:
                 raw/phase-NN-session-NN-[topic]-transcript.md         ← verbatim, immutable
                 findings/phase-NN-session-NN-[topic]-results.md       ← AI-structured from transcript

Within 24h:      output/phase-NN-session-NN-[topic]-conclusions.md

After final session of phase:
                 output/phase-NN-conclusions.md  (full phase synthesis)
```

**Note:** Sessions produce TWO findings files — field-notes (human, during session) and results (AI, from transcript). They are different documents with different authorship and different roles in synthesis.

### Addendum plan lifecycle

Addendums extend a closed POC or research finding with new hypotheses. They have a full plan → results → conclusions lifecycle, but three rules that differ from POC lifecycle:

1. **Parent reference required in plan header.** Every addendum plan must include a `**Parent conclusions:**` link pointing to the parent conclusions file. Do not start an addendum without loading the parent context first (Rule 8).
2. **Conclusions trigger a parent backlink.** When addendum conclusions are written (via `/activity-conclude addendum`), the parent conclusions file is updated with an `## Addendums` section linking back to the addendum conclusions. One entry per addendum, in order. This is not optional.
3. **Backlog entry updated.** When an addendum is created from a `plans/discovery-backlog.md` entry, update that entry's Status from `Plan created` to `In Progress`, and again to `Complete` when conclusions are written.
4. **Downstream Dependencies declared at plan creation.** Every addendum plan must populate the `§Downstream Dependencies` table (from the template) at creation time. When addendum conclusions are written, fill the `§Downstream Impact` table in the conclusions file — review each registered downstream item against the verdict. "None identified." is valid; leaving either table empty (beyond the template placeholder) is a completeness error.
5. **Conclusions alignment verified before downstream work.** Before running `/activity-new [type]` for work that depends on prior addendum conclusions, check that those conclusions carry an `**Alignment verified:**` date (Rule 12). If absent, run `/conclusions-review` first. Plans must carry the escalation protocol note in their prerequisites: if a required tool is unavailable, stop and ask the user — do not attempt workarounds (Rule 13).

```
Before addendum:  plans/discovery-backlog.md entry exists (from signal or external trigger)
                  plans/phase-NN-[parent-identifier]-addendum-NN-[slug]-plan.md  ← load parent context first
                  findings/phase-NN-[parent-identifier]-addendum-NN-[slug]-results.md  ← stub, AI fills during execution

After execution:  output/phase-NN-[parent-identifier]-addendum-NN-[slug]-conclusions.md
                  output/phase-NN-[parent-identifier]-conclusions.md  ← ## Addendums section updated
                  plans/discovery-backlog.md  ← entry marked Complete
```

### When to create a new plan file
- Not for minor updates — update in place
- New phase begins → new `phase-0N-index.md` + session files
- Archive old plans in `plans/_archive/` with a log.md entry

### How to create a new session file

Every session file — regardless of type — must follow this structure. Copy this as a starting template.

**Canonical section order:**

```
# Phase N — Session N: [Session Name]

**Last updated:** YYYY-MM-DD
**Duration:** [duration]
**Participants:** [who attends]
**Format:** [optional — only for non-standard formats like shadowing]
**Goal:** One sentence. What this session must accomplish.

> For phase-blocking gaps, risk register, and decisions tracker → [phase-0N-index.md](./phase-0N-index.md)

---

## Pre-Requisites          ← sessions with dependencies (internal, sign-off)
                            ← checklist: what must exist before this session starts

## Prep Before This Session ← sessions that need setup work (all client sessions)
                            ← bullet list: what to prepare, build, or confirm in advance

## Agenda                  ← structured sessions with time blocks (all except shadowing)
                            ← time | item table

## Observation Checklist   ← shadowing sessions (product walkthroughs)
                            ← grouped checklist by domain (navigation, tables, charts, forms, components)

## Questions               ← client-facing sessions (priority table format — see below)
## Key Decisions           ← decision-oriented sessions (7, 8) — table of what must close

## Outputs to Capture      ← ALL sessions — checklist of what must exist after this session
## After the Session       ← ALL sessions — file paths + index update instructions
```

**Questions section format** — always a priority table, never a numbered list:
```markdown
| Priority | Question |
|----------|---------|
| ★ | Phase-blocking or must-answer-in-this-session question |
| — | Secondary — useful but can be deferred |
```

**After the Session format** — always includes:
```markdown
## After the Session

- Field notes (during session) → `findings/phase-0N-session-0N-[topic]-field-notes.md`
- Results (from transcript, when available) → `findings/phase-0N-session-0N-[topic]-results.md`
- Transcript (if recorded) → `raw/phase-0N-session-0N-[topic]-transcript.md`
- Conclusions (within 24h) → `output/phase-0N-session-0N-[topic]-conclusions.md`
- Update decisions tracker in [phase-0N-index.md](./phase-0N-index.md)
```

Internal sessions (no client attendance) omit the transcript line. Sessions that produce specific artifacts (UI audit, architecture draft) add those paths explicitly.

**Section rules:**
- Pre-Requisites: use for sessions 6, 7, 8 (anything with hard dependencies)
- Prep Before This Session: use for all client-facing sessions
- Agenda: use for structured sessions; omit for shadowing (replace with Observation Checklist)
- Observation Checklist: shadowing sessions only — always grouped by domain
- Questions / Key Decisions: mutually exclusive — use Questions for open-ended client sessions, Key Decisions for sessions that must close specific items
- Outputs to Capture and After the Session: every session, no exceptions

---

## 10. How to Use findings/ and output/

### findings/ — four types, two authorship rules

**Field notes** (`-field-notes.md`) — Human-authored. Personal observations during or after a session. Informal, primary source. Written in first person, no template structure enforced beyond the header. Do not clean up or synthesize — they are the permanent record of what was observed. Use `session.field-notes-template.md`.

**POC results** (`-results.md`, process: `poc-NN`) — AI-structured. Filled during POC execution using `poc.results-template.md`. Captures steps, raw output, interpretation, hypothesis resolution. Evidence base for the conclusions file. Citable.

**Addendum results** (`-results.md`, process: `[parent-identifier]-addendum-NN`) — AI-structured. Filled during addendum execution using `addendum.results-template.md`. Covers new hypotheses only — does not re-examine parent hypotheses. Triggered by an external discovery that extends any closed parent document (POC, research, or session). Numbered per parent and sequential. Requires a corresponding addendum conclusions file. When addendum conclusions are written, update the parent conclusions file with an `## Addendums` backlink section (one line per addendum: link + one-sentence verdict summary).

**Signal results** (`-results.md`, process: `signal-NN`) — AI-structured. Assessment artifact for external discoveries with no parent document. Uses `signal.results-template.md`. Determines whether the discovery warrants an addendum, a new POC/research plan, backlog, or discard. No conclusions file. Add entry to `plans/discovery-backlog.md`. Signal numbering is global per phase (not per parent).

**Research results** (`-results.md`, process: `research`) — AI-structured. Filled after executing a research plan using `research.results-template.md`. Covers questions asked, what was found, solved vs. gaps, sources. Citable.

**Handoff** (`-handoff.md`) — AI-structured. Transitional synthesis between phases or POCs. Captures what the prior stage proved, what it left open, and what the next stage must address.

**Authorship rule:** Field notes are primary source — interpret them, don't cite them directly. Results are structured evidence — cite them in conclusions. This distinction matters for agent behavior: the Librarian prioritizes results over field-notes when surfacing prior context.

### output/ workflow
- Created after synthesis — never during raw observation
- Session conclusions: field-notes + results (when available) → what we learned, what it means, what decisions it closes
- POC conclusions: poc-results → verdict, evidence summary, deferred observations, decisions closed, **addendum candidates** (forward signals — PARTIAL verdicts, proxy-tested items, deferred hypotheses, new questions)
- Research conclusions: research-results → only when research explicitly closes a tracked decision
- Phase conclusions: all session + POC conclusions → full phase synthesis, milestone gate

**`**Alignment verified:**` field lifecycle:**
Every conclusions file (POC, addendum, session, research) carries this field in its metadata block. It is empty when the file is created. Two events set it:
1. `/activity-conclude [type]` sets it automatically at the end of Step 6 — because it performs alignment work inline (tracker, roadmap, backlink, wiki updates). Not set for the `session` type (no conclusions file yet).
2. `/conclusions-review` sets it after running all 4 passes (patch list, stub fills, new coverage, forward signals) — even when issues are found, the date records "reviewed on this date."
Rule 12 (`.claude/rules/behavioral.md`) checks this field before any downstream work begins. `/knowledge-audit` Dimension 11 flags any Complete conclusions file where the field is still empty. The `check-conclusions-alignment.sh` Stop hook also warns at session close.

### The full pipeline
```
Client/manager → raw/                (transcript, documents — immutable)
Human observes → findings/*-field-notes.md    (personal, primary source)
Team executes  → findings/*-results.md        (structured evidence — POC or research)
Team synthesizes → output/           (conclusions, deliverables)
Stable knowledge → wiki/             (reference that compounds)
Active decisions → plans/            (tracker, updated in real time)
Working files  → tmp/               (audits, trackers — lifecycle-limited)
```

---

## 11. How to Maintain log.md

`log.md` is at the project root. **Append-only — never edit existing entries.**

### Format
```markdown
## [YYYY-MM-DD] [action] | [path] | [summary]
[1–3 lines: what happened and why]
```

**Action types:** `create` | `update` | `restructure` | `archive` | `delete` | `ingest` | `move`

> `move` — content relocated from one file to another via `/wiki-manage move`. Format: `move | source/file.md §N → destination/file.md §M | reason`

### When to add an entry
- Wiki file created or substantially updated
- Plan created, versioned, or archived
- Project structure changes (new folder, rename, restructure)
- Session produces findings or conclusions files
- Confirmed fact changes in CLAUDE.md

---

## 12. Pruning Stale Content

### Signs content is stale
- References a decision now confirmed (update TBD, remove question)
- Recommendation superseded by a client decision
- References "upcoming sessions" that already happened
- Last-updated date more than 3 months old with no changes

### How to prune
- **Update, don't delete** unless content is genuinely wrong
- **Archive, don't destroy** — move obsolete sections to `_archive/` or add "Archived" heading
- **Log every deletion** in log.md

### The "would I cite this?" test
Would you confidently cite this in a client session? If not — update it, shrink it, or remove it.

---

## 13. The 6-Month Horizon Test

Every wiki file should pass: could someone use it in 6 months, without having been in the project, to answer a real question?

**Three questions:**
1. What question can this file answer that isn't already in my head?
2. What would I look up here 6 months from now that I can't answer today?
3. If a new designer joined next month, could they get up to speed from this file?

**Monthly utility check:** After reading any wiki page — *"What question could I answer with this that I couldn't before?"* If weak — rewrite for synthesis or cut.

---

## 14. Trigger Events — When to Update What

| Event | CLAUDE.md | wiki/meta | wiki/project | plans | findings | output | log.md |
|-------|-----------|-----------|-------------|-------|----------|--------|--------|
| New confirmed fact from session | ✅ | ❌ | ✅ project/ | ✅ decisions | ❌ | ❌ | ✅ |
| Session completed — field notes | ❌ | ❌ | ❌ | ✅ decisions | ✅ field-notes | ❌ | ✅ |
| Session completed — transcript available | ❌ | ❌ | ❌ | ❌ | ✅ results | ❌ | ✅ |
| Session conclusions written | ✅ maybe | ❌ | ✅ if decisions | ✅ decisions | ❌ | ✅ | ✅ |
| Research plan started | ❌ | ❌ | ❌ | ✅ new plan | ✅ results stub | ❌ | ✅ |
| Research results complete | ❌ | ❌ | ❌ | ❌ | ✅ results | ❌ | ✅ |
| Research conclusions written (closes decision) | ✅ maybe | ❌ | ✅ if decisions | ✅ decisions | ❌ | ✅ | ✅ |
| POC plan started | ❌ | ❌ | ❌ | ✅ new plan | ✅ results stub | ❌ | ✅ |
| POC results complete | ❌ | ❌ | ❌ | ❌ | ✅ results | ❌ | ✅ |
| POC conclusions written | ✅ maybe | ❌ | ✅ if decisions | ✅ decisions | ❌ | ✅ | ✅ |
| Addendum plan started | ❌ | ❌ | ❌ | ✅ new plan + backlog update | ✅ results stub | ❌ | ✅ |
| Addendum results complete | ❌ | ❌ | ❌ | ❌ | ✅ results | ❌ | ✅ |
| Addendum conclusions written | ✅ maybe | ❌ | ✅ if decisions revised | ✅ decisions if revised | ❌ | ✅ + parent backlink | ✅ |
| Signal assessed (external discovery, no parent) | ❌ | ❌ | ❌ | ✅ backlog entry | ✅ signal results | ❌ | ✅ |
| **Structural change** (new folder, naming convention, template type, process type, behavioral rule) | ✅ Rule 10 | ✅ **both meta docs** | ❌ | ❌ | ❌ | ❌ | ✅ |
| New wiki file created | ❌ | ❌ | ✅ new + index | ❌ | ❌ | ❌ | ✅ |
| New plan or phase starts | ✅ pointer | ❌ | ❌ | ✅ new index | ❌ | ❌ | ✅ |
| Phase synthesis complete | ❌ | ❌ | ❌ | ✅ maybe | ❌ | ✅ | ✅ |
| Scope change | ✅ | ❌ | ✅ maybe | ✅ | ❌ | ❌ | ✅ |
| /knowledge-audit run | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (tmp/ file created) |
| /conclusions-review run | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ sets **Alignment verified:** on target file | ✅ (tmp/ file if persistent copy requested) |
| Monthly audit | ✅ if needed | ✅ currency check | ✅ prune | ✅ archive closed | ❌ | ❌ | ✅ |

> **⚠️ Structural changes that modify a skill, agent, or hook:** functional test also required (Rule 15) — confirm actual behavior, not just that the text is correct. See `wiki/meta/system-architecture.md §7` for what counts as a functional test.

---

## 15. The Framework in Practice — Activity-by-Activity Patterns

This section is the designer-facing guide: what to do at each stage of each activity, and why the structure is the way it is.

### Starting an activity

Always use `/activity-new [type]` — it loads prior conclusions, open decisions, and wiki state before creating the plan. Never create a plan file manually; the skill ensures alignment is checked first (Rule 12).

**If the previous conclusions file lacks an `**Alignment verified:**` date:** `/activity-new` will catch this and prompt `/conclusions-review` before proceeding. Don't skip it.

### During execution — use notes, not results

The `*-notes.md` file is your working surface. Write freely — raw observations, open questions, scratch. It is explicitly *not* a structured record; it exists so results stay clean.

Common mistake: writing directly into results while the activity is in progress. Results are synthesized *after* the activity closes, from notes. A results file that was written live is usually a mix of observations and interpretation that's hard to untangle.

### Closing an activity

Use `/activity-conclude [type]`. It:
1. Synthesizes notes → results (if notes exist and results don't)
2. Reviews results → proposes conclusions
3. Routes conclusions to `output/`
4. Sets the `**Alignment verified:**` date
5. Prompts wiki updates
6. Appends to `log.md`

Don't manually write conclusions. The skill enforces the structure, the evidence chain, and the alignment field — all of which downstream activities depend on.

### Signal vs. addendum routing

A **signal** has no parent document. Use `signal.results-template.md` → `findings/`. Signals route to `plans/discovery-backlog.md` and don't have their own conclusions. If a signal grows into a testable hypothesis, it becomes a POC or research plan.

An **addendum** has a parent conclusions file. Use the addendum plan template → activate with `/activity-new addendum`. The addendum's conclusions file carries a backlink to the parent and a `§Downstream Impact` section.

### When conclusions close a wiki decision

After `/activity-conclude`, if a decision in `wiki/project/` or `plans/phase-NN-index.md §Decisions Tracker` is now resolved:
1. Update the tracker (mark the decision closed, record the conclusion)
2. Run `/wiki-manage` to propagate to the relevant wiki files
3. Check CLAUDE.md — if a confirmed fact changed, update it (Rule 10)

### The notes file lifecycle

Notes files are tier-1 capture — informal and short-lived. After `/activity-conclude` runs and results are complete, the notes file can be deleted or archived to `tmp/`. It should never be cited in conclusions or wiki. If an observation is worth keeping, it belongs in results.

