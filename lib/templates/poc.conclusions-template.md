---
type: poc-conclusions
phase: "[NN]"
topic: "[short-name]"
status: in-progress
alignment_verified: ""
---

# Phase N — POC XX: [Title] — Conclusions

<!--
TEMPLATE — copy this file, rename it, fill in the brackets.
Naming convention: conclusions/phase-NN-poc-NN-[short-name]-conclusions.md
This file is written AFTER the session notes are complete.
Source of truth: findings/phase-NN-poc-NN-[name]-notes.md
-->

**Status:** Complete
**Author:** AI
**Source:** `findings/phase-NN-poc-NN-[name]-results.md`
**Plan:** `plans/phase-NN-poc-NN-[name]-plan.md`
**Synthesis date:** YYYY-MM-DD
**Validated:** [External validation method — e.g., "Step N-1 web search cross-reference + gap tests confirmed"]
**Alignment verified:**

> This is the synthesized output, not raw findings.
> Raw observations → the findings file above.
> Methodology and hypotheses → the plan file above.

---

## H1 — [Hypothesis Title]

<!--
One section per hypothesis. Title = short label from the hypotheses table.
Status options: CONFIRMED | REFUTED | PARTIAL REFUTATION
-->

**Status:** CONFIRMED / REFUTED / PARTIAL REFUTATION

**Finding:**
[2–4 sentences. What was actually observed? Be precise — state what worked, what didn't, and any nuance (e.g., "works but requires X" = PARTIAL). Reference the findings file for full output.]

**Decision:**
[1–3 sentences. What does [next phase] do as a result of this finding? This is the actionable consequence — not just what we learned, but what we will DO differently.]

**Wiki update:**
[Which file(s) were updated and which section? Format: `file.md §N` — brief description of what changed. If no wiki update was needed, write "None — [reason]".]

---

## H2 — [Hypothesis Title]

**Status:** CONFIRMED / REFUTED / PARTIAL REFUTATION

**Finding:**
[What was observed]

**Decision:**
[What the next phase does]

**Wiki update:**
[Files and sections updated]

---

<!-- Repeat H block for each hypothesis -->

---

## Evidence Summary

<!--
Key raw observations from the findings file that drove the verdicts above.
This section makes the conclusions self-contained — a reader should not need to open
the findings file to understand WHY each verdict was reached.

One subsection per hypothesis. Quote or closely paraphrase the most diagnostic outputs.
Include: specific numbers, error messages, tool responses, and any surprises.
This is NOT a re-summary of the finding — it's the evidence that backs it up.
-->

### H1 — [Hypothesis Title]

> [Quote or precise summary of the key output from Step N that confirmed/refuted this hypothesis]
> [Include specific numbers, exact error text, or tool response excerpts]

### H2 — [Hypothesis Title]

> [Quote or precise summary of key evidence]

<!-- Repeat for each hypothesis -->

---

## Deferred Observations

<!--
Observations from the findings file that don't fit any hypothesis but matter for future phases.
These are often the most valuable things — edge cases, implementation pitfalls, unexpected behaviors.
Do NOT discard these. Future POC plans should reference this section.

Format: one bullet per observation. Include the step reference.
If nothing was deferred, write "None identified." — do not leave blank.
-->

- **[Step N]** [Observation that doesn't map to a hypothesis — describe precisely]
- **[Step N]** [Implementation pitfall or edge case worth carrying forward]

---

## Decisions Closed

<!--
Table of every decision from plans/phase-NN-index.md §Decisions Tracker that this POC closes.
Copy the decision text exactly from the tracker — makes cross-referencing easy.
-->

| Decision | Resolution |
|----------|-----------|
| [Decision text from tracker] | **[Short answer]** — [brief explanation if needed] |
| [Decision text] | **[Short answer]** |

---

## Wiki Files Updated

<!--
Every file that was updated as part of conclusion synthesis.
Be specific about section — helps future sessions find what changed without reading the whole file.
-->

| File | Section | Change summary |
|------|---------|---------------|
| `wiki/project/[file].md` | §N [Section name] | [What changed in one line] |
| `plans/phase-NN-index.md` | §Decisions Tracker | [N] decisions closed |
| `plans/phase-NN-poc-roadmap.md` | POC table | Status updated to ✅ Complete |

---

## Addendum Candidates

<!--
Forward-looking signals from this POC that may warrant follow-up work.
Fill this section at synthesis time so /conclusions-review pass 4 can process it.

Signal types:
  PARTIAL verdict   — a hypothesis was only partly confirmed; the untested half warrants a follow-up
  proxy-tested      — a finding was validated on a substitute (not the real target file/component)
  deferred hyp      — a hypothesis was explicitly deferred to a future POC
  new question      — the POC surfaced a question not in the original hypothesis set

Recommended actions (pick one per entry):
  addendum          — follow-up hypothesis within this POC's scope
  new POC           — distinct testable question warranting its own POC
  backlog           — low-priority or far-future item (add to plans/discovery-backlog.md)

If nothing was deferred and all hypotheses are fully confirmed, write "None." — do not leave blank.
-->

| Signal type | Description | Recommended action |
|-------------|-------------|-------------------|
| [PARTIAL verdict / proxy-tested / deferred hyp / new question] | [What the signal is and why it matters] | [addendum / new POC / backlog] |
