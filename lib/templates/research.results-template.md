# [Topic] — Research Brief

<!--
TEMPLATE — copy this file, rename it, fill in the brackets.
Naming convention: findings/phase-NN-[topic]-research.md
Use this template for research briefs that are NOT POC session notes.
For POC session notes, use: lib/templates/poc.results-template.md (in canon package)
-->

**Date:** YYYY-MM-DD
**Status:** Exploratory / Complete
**Feeds:** [Which session, POC, or decision this research informs — e.g., "Session 7 (Architecture Workshop)"]

<!--
If this file's conclusions have been superseded by confirmed decisions, add a note here:
> **Note:** Architecture decisions confirmed [date] supersede version references in this file.
> Current confirmed decisions → [link to relevant wiki file].
-->

> [Any version note or supersession notice]

---

## Why This Exists

<!--
2–3 sentences. What question does this research answer?
What would we not know without it?
What gap in existing documentation prompted this research?
-->

[What prompted this research and what gap it fills]

---

## [Section 1 — Topic or Question]

<!--
One section per major question or layer. Naming is flexible.
Common patterns:
  - "Layer N: [Topic]" for pipeline-layer research
  - "Section N: [Topic]" for open-ended topic research
  - Named by question: "Does X work for our stack?"
-->

**Status:** ✅ Solved, well-documented / ⚠️ Partially solved / ❌ Gap — no solution exists

<!--
Body: what the research found. Be specific — include tool names, repo links, version numbers.
Distinguish between "industry consensus" and "confirmed first-hand."
If something is first-hand confirmed, say so and reference where (POC findings, session notes).
If something is industry research, cite the source.
-->

[Research content]

### Best Reference

[If there is one canonical reference for this section, call it out here. URL, author, date.]

### Production Examples

[Links to inspectable repos or documented implementations, if available.]

---

## [Section 2 — Topic or Question]

**Status:** ✅ / ⚠️ / ❌

[Research content]

---

<!-- Repeat section blocks as needed -->

---

## Summary: Solved vs Gaps

<!--
Always include this table. It's the first thing someone reads when they want a quick answer.
"Best Reference" = most useful single source for the "yes" cases; "Our approach" for gaps.
-->

| Layer / Question | Status | Best Reference |
|-----------------|--------|----------------|
| [Layer or question] | ✅ Solved | [Source] |
| [Layer or question] | ⚠️ Partially solved | [Source] |
| [Layer or question] | ❌ Gap | Our approach: [brief description] |

---

## Sources

<!--
Numbered or bulleted list. Include: author/org, title, URL, date where available.
Distinguish between: primary sources (specs, changelogs), secondary sources (blog posts, tutorials), and first-hand (our own POC findings).
-->

- [Author/Org — "Title" — URL — Date]
- [Source]
- First-hand: `findings/[file].md §[section]`
