---
name: signal
description: Capture a discovery in 2 minutes without interrupting current work. Works whether or not an activity is open.
compatibility: Claude Code
---
# /signal

Capture a discovery in 2 minutes without interrupting current work. Works whether or not an activity is open.

## When to use
Any time a discovery surfaces that doesn't fit the current activity — or when there is no current activity. Designed for 2-minute capture without interrupting what you're doing.

## Arguments
- `<slug>` (required): a 2–4 word identifier for the discovery (e.g., `figma-variable-scoping`, `user-mental-model-mismatch`)

---

## What happens

**Step 1 — Capture**
Ask for a brief description of the discovery (2–3 sentences, rough is fine). Ask: is this External (came from outside the project — article, tool, community post) or Internal (surfaced while doing project work — mid-activity insight, cross-activity pattern, synthesis realization)?

**Step 2 — Route check**
- Ask: "Does this extend a specific closed parent document (a POC, research, or session you can name)? [y/N]" — default is N.
- If yes: "That sounds like an addendum candidate. Run `/activity-new addendum [parent]` instead — signals are for discoveries with no clear parent. Proceed as signal anyway? [Y/n]"
- If no (default), or user confirms signal anyway → proceed.

Rationale: most signals arrive here precisely because the user already determined there's no clear parent (Rule 11's gate). The route check is a low-friction confirmation, not a skeptical primary question.

**Step 3 — Classify assessment**
Based on the description, suggest one assessment from `signal.results-template.md`:
- External / extends a closed parent → Addendum candidate
- New testable hypothesis → New POC needed
- Open research question → New research needed
- Trustworthy finding that directly updates a wiki file → Wiki update (use `/wiki-manage promote`)
- Interesting but not actionable now → Backlog
- Not relevant to scope → Discard

Present as a recommendation — human confirms.

**Step 4 — Create results file**
Create `findings/phase-NN-signal-NN-[slug]-results.md` using `signal.results-template.md`. Pre-fill:
- Discovery type (External/Internal) from Step 1
- Source fields filled from the description
- Assessment pre-checked based on Step 3 suggestion

**Step 5 — Register, add to backlog, and log**
- Add the results file to `CONTENT_INDEX.md` (standard entry format)
- Add entry to `plans/discovery-backlog.md`: signal number, slug, assessment type, date
- Append to `log.md`: `[date] create | findings/phase-NN-signal-NN-[slug]-results.md | Signal captured: [slug]. Assessment: [type].`

**Step 6 — Return routing**
Summarize: *"Signal [slug] captured. Assessment: [type]. Recommended next: [specific action — e.g., 'Run /activity-new addendum poc-02 when ready. No action required now.']"*

---

## Constraints
- Never blocks current work — after Step 6, return control immediately
- Never creates plan or conclusions files — signal.results is the only artifact
- If run during an activity: the current activity stays open; the signal is a parallel capture
