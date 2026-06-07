<!--
APPEND-SECTION REFERENCE — not a standalone file.
When /activity-conclude addendum runs, this structure is appended to the parent POC conclusions file
as a "## Addendum NN" section. No standalone file is created.
Destination: conclusions/phase-NN-poc-NN-[parent-name]-conclusions.md §Addendum NN

This template shows the structure that gets appended. H-numbers continue from the parent.
-->

---

## Addendum NN — [slug]

<!--
This section is appended to the parent POC conclusions file by /activity-conclude addendum.
H-numbers continue from parent (H8+ if parent concluded at H7).
Parent hypotheses H1–H7 remain valid unless listed in §Decisions Revised below.
-->

**Source:** `findings/phase-NN-[parent-identifier]-addendum-NN-[slug]-results.md`
**Synthesis date:** YYYY-MM-DD
**Addendum alignment verified:**

> H-numbers continue from parent (H8+). Parent hypotheses H1–H7 remain valid unless
> listed in §Decisions Revised below.

---

## H8 — [Hypothesis Title]

<!--
One section per new hypothesis. Same format as the parent POC conclusions.
Status options: CONFIRMED | REFUTED | PARTIAL REFUTATION
-->

**Status:** CONFIRMED / REFUTED / PARTIAL REFUTATION

**Finding:**
[2–4 sentences. What was actually observed? Be precise — state what worked, what didn't, and any nuance.]

**Decision:**
[1–3 sentences. What does this mean for [next phase]? What do we DO differently as a result?]

**Wiki update:**
[Which file(s) were updated and which section? Or "None — [reason]."]

---

## H9 — [Hypothesis Title]

**Status:** CONFIRMED / REFUTED / PARTIAL REFUTATION

**Finding:**
[What was observed]

**Decision:**
[What the next phase does]

**Wiki update:**
[Files and sections updated]

---

<!-- Repeat H block for each new hypothesis -->

---

## Evidence Summary

<!--
Key raw observations from the addendum results file that drove the verdicts above.
Enough detail that a reader doesn't need to open the results file to understand why each verdict was reached.
-->

### H8 — [Hypothesis Title]

> [Quote or precise summary of the key output that confirmed/refuted this hypothesis]
> [Include specific numbers, error messages, or tool response excerpts]

### H9 — [Hypothesis Title]

> [Key evidence]

---

## Decisions Revised

<!--
List ONLY decisions that CHANGE from the parent conclusions.
If nothing changes, write "None — all parent decisions remain valid."
Be explicit — ambiguity here creates drift.
-->

| Decision | Parent verdict | Revised verdict | Reason |
|----------|---------------|----------------|--------|
| [Decision text — copy exactly from parent] | [Original conclusion] | [New conclusion] | [Why it changed — one sentence] |

---

## Decisions Unchanged

<!--
Explicitly confirm parent decisions that are NOT affected by this addendum.
Copy the decision text from the parent conclusions §Decisions Closed table.
"Unchanged" must be stated explicitly — silence reads as oversight.
-->

The following decisions from [parent conclusions link] are unaffected by this addendum:

| Decision | Parent verdict | Status |
|----------|---------------|--------|
| [Decision text] | [Original verdict] | Unchanged |
| [Decision text] | [Original verdict] | Unchanged |

---

## Wiki Files Updated — Addendum NN

<!--
Every file updated as part of this addendum synthesis.
The parent POC conclusions file is already updated (this section IS in it) — list other wiki changes only.
-->

| File | Section | Change summary |
|------|---------|---------------|
| `wiki/project/[file].md` | §N [Section name] | [What changed in one line] |
| `plans/phase-NN-index.md` | §Decisions Tracker | [N] decisions revised |

---

## Downstream Impact

<!--
For each entry in the plan's §Downstream Dependencies table: did this addendum's verdict
require the downstream POC/session to update its plan, hypotheses, or prerequisites?
Status values:
  Notified — reviewed; no change needed given this verdict
  Plan update needed — describe what must change
  Pending — not yet reviewed
If no downstream items were registered in the plan, write "None registered."
-->

| POC / Session | Dependency | Verdict impact | Status |
|---------------|-----------|----------------|--------|
| [identifier]  | [what it depended on] | [what changed, if anything] | Notified / Plan update needed / Pending |

---

## Deferred Observations

<!--
Observations from the results file that don't map to any hypothesis but matter for future phases.
These are often the most valuable — edge cases, unexpected behaviors, new gaps.
If nothing was deferred, write "None identified." — do not leave blank.
-->

- **[Step N]** [Observation that doesn't map to a hypothesis — describe precisely]
