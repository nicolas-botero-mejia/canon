# Template Map

**Last updated:** 2026-06-02
**Purpose:** Maps every template to its destination folder, file suffix, and when to use it.

> **Rule:** Every file type must have a template before more files of that type are created.
> Template naming convention: `[process-type].[file-type]-template.md`

---

## Template → File Mapping

| Template | Destination folder | File suffix | When to use |
|----------|-------------------|-------------|-------------|
| `poc.plan-template.md` | `plans/` | `phase-NN-poc-NN-[name]-plan.md` | Before starting a POC — defines hypotheses, session flow, success criteria. Includes escalation protocol in Prerequisites: if a required tool is unavailable, stop and ask the user. |
| `poc.notes-template.md` | `findings/` | `phase-NN-poc-NN-[name]-notes.md` | During POC execution — live observations, open questions, scratch; pre-synthesis tier |
| `poc.results-template.md` | `findings/` | `phase-NN-poc-NN-[name]-results.md` | After POC closes — structured execution log, hypothesis resolution (synthesized from notes) |
| `poc.conclusions-template.md` | `output/` | `phase-NN-poc-NN-[name]-conclusions.md` | After POC results are complete — synthesized verdict, evidence summary, decisions closed. Includes `**Alignment verified:**` field (set by `/conclusions-review`) and `## Addendum Candidates` section for forward signals (PARTIAL verdicts, proxy-tested items, deferred hypotheses, new questions) — used by `/conclusions-review` pass 4. |
| `addendum.notes-template.md` | `findings/` | `phase-NN-[parent-id]-addendum-NN-[slug]-notes.md` | During addendum execution — live observations on external source, preliminary parent-mapping; pre-synthesis tier |
| `addendum.plan-template.md` | `plans/` | `phase-NN-[parent-identifier]-addendum-NN-[slug]-plan.md` | When an external discovery extends any closed parent document (POC, research, or session) — defines new hypotheses, test approach. `[parent-identifier]` = parent's own ID segment (e.g. `poc-02`, `research-mcp-landscape`, `session-04`). Includes §Pre-session Prerequisites with escalation protocol and §Downstream Dependencies — required at plan creation. |
| `addendum.results-template.md` | `findings/` | `phase-NN-[parent-identifier]-addendum-NN-[slug]-results.md` | During/after addendum execution — raw observations for new hypotheses only |
| `addendum.conclusions-template.md` | `output/` | `phase-NN-[parent-identifier]-addendum-NN-[slug]-conclusions.md` | After addendum results — new hypothesis verdicts, decisions revised (if any), parent backlink. Includes `**Alignment verified:**` field (set by `/conclusions-review`) and §Downstream Impact — required at conclusions synthesis. |
| `signal.results-template.md` | `findings/` | `phase-NN-signal-NN-[slug]-results.md` | When an external discovery has no parent document — assessment artifact, routes to action or backlog |
| `research.plan-template.md` | `plans/` | `phase-NN-research-[topic]-plan.md` | Before starting a research effort — what question, why, what sources |
| `research.notes-template.md` | `findings/` | `phase-NN-research-[topic]-notes.md` | During research execution — source log, live observations, emerging patterns; pre-synthesis tier |
| `research.results-template.md` | `findings/` | `phase-NN-research-[topic]-results.md` | After research closes — synthesized findings, solved vs. gaps, sources |
| `research.conclusions-template.md` | `output/` | `phase-NN-research-[topic]-conclusions.md` | Only when research closes a tracked decision |
| `session.field-notes-template.md` | `findings/` | `phase-NN-session-NN-[topic]-field-notes.md` | During/after a client session — human personal observations, informal, primary source |
| `session.results-template.md` | `findings/` | `phase-NN-session-NN-[topic]-results.md` | After transcript/recording is available — AI-structured analysis of session content |
| `session.conclusions-template.md` | `output/` | `phase-NN-session-NN-[topic]-conclusions.md` | After session results are reviewed — decisions confirmed, wiki updates, tracker updates |
| `handoff.results-template.md` | `findings/` | `phase-NN-handoff-[source]-to-[dest]-handoff.md` | Transitional context-transfer between phases or POCs — what was settled, what is left open, what the next stage must do. NOT a conclusions file. |
| `tmp.working-file-template.md` | `tmp/` | `[descriptive-name].md` | Any transient project management file — audits, status trackers, coverage checks |

---

## Author Convention

Each file carries an `**Author:**` metadata field:

| Value | Meaning |
|-------|---------|
| `Human` | Written by a team member — primary source, no template enforced |
| `AI` | Written by Claude — template-driven, structured evidence |
| `Mixed` | Filled during live session by both human and AI |

---

## Process Types

| Process | Has plan? | Has notes? | Has results? | Has conclusions? | Notes |
|---------|-----------|-----------|-------------|-----------------|-------|
| `poc` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | Full lifecycle, heavy structure |
| `research` | ✅ Required | ✅ Required | ✅ Required | ⚠️ Only if closes a decision | Lighter plan than POC |
| `addendum` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | Extends any closed parent doc. New hypotheses only. |
| `session` | ✅ Required (in plans/) | field-notes (human) | ✅ results (AI, from transcript) | ✅ Required | Two findings types per session |
| `signal` | ❌ | ❌ | ✅ Required | ❌ | Assessment artifact only. Routes to addendum / POC / backlog. |
| `handoff` | ❌ | ❌ | ✅ in findings/ | ❌ | Transitional doc between phases/POCs |
| `tmp` | ❌ | ❌ | ❌ | ❌ | Working files only, not knowledge |

---

## Creating a New Template

When a new file type appears with no existing template:

1. Identify the process type and file type
2. Create `wiki/meta/templates/[process-type].[file-type]-template.md`
3. Add a row to this template-index
4. Register the new template in `CONTENT_INDEX.md`
5. Add an entry to `log.md`
