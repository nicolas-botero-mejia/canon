# /knowledge-audit

Run a full consistency and currency check on the knowledge base. Produces an actionable issues report in tmp/ — no auto-execution.

## When to use
- On demand when something feels inconsistent or stale
- Before starting a new phase (as part of `/phase-conclude`)
- After a significant period of work where multiple files changed
- Regularly (monthly or after 3+ sessions)

## Arguments
- Phase (optional): defaults to current active phase
- Scope (optional): `wiki` | `findings` | `tmp` | `meta` | `all` (default: all)

## What happens

The Librarian runs all 14 audit dimensions and produces a single structured report.

**Dimension 1 — Contradictions**
Reads all wiki/project/ and wiki/standards/ files. Identifies incompatible claims about the same fact, version, or decision.

Two scopes — both required:
- **Cross-file:** any two files make incompatible claims. *Example: a wiki file says a library is at version 8; CLAUDE.md says the same library is at version 10.*
- **Intra-file:** two sections within the same file make incompatible claims. *Example: §1 lists a tool as active; §7 of the same file says it was removed from the stack. §4 describes a file as "POC-confirmed, reusable as-is"; a note in §4b marks it as a deferred alternative.* Read each wiki/project/ file fully and check all sections against each other — not just the section most recently updated.

**Dimension 2 — Meta-doc currency (Rule 10)**
Reads `log.md` — finds all `restructure` and structural `create` entries.
Reads `**Last updated:**` in `system-architecture.md (framework wiki, in node_modules)` and `system-operations.md (framework wiki, in node_modules)`.
If either meta doc predates the most recent structural log entry → flags: *"Meta-doc drift: [specific log entry] was not reflected in [file]. Sections needing update: [§N, §M]."*

**Dimension 3 — Stale content**
Identifies wiki sections that:
- Reference a decision as "TBD" or "open" that is now Closed in the decisions tracker
- Reference a version that differs from the confirmed tech stack in CLAUDE.md
- Say "upcoming session" for a session that has already happened

**Dimension 4 — Orphans**
Reads CONTENT_INDEX.md. For each file listed, checks whether any other project file links to it. Files with no incoming links are flagged as potential orphans (not automatic — some files are legitimately standalone reference docs).

**Dimension 5 — Missing coverage**
Reads `plans/phase-NN-index.md §Confirmed Facts`. For each confirmed fact, checks whether it appears anywhere in wiki/project/. Facts with no wiki coverage are flagged as missing.

**Dimension 6 — Structural inconsistency**
Scans wiki/ files for: inconsistent header metadata formats, bare text paths vs. markdown links, heading depth that differs significantly from the majority of files.

**Dimension 7 — Finding type compliance**
Scans `findings/` files. For each file: does it have an `**Author:**` field? Does its suffix match its type (field-notes vs. results vs. handoff)? Flags any non-compliant files.

**Dimension 8 — tmp/ lifecycle**
Reads each file in `tmp/`. For each: reads its `**Closes when:**` condition and assesses whether the condition has been met. Flags files ready for cleanup.

**Dimension 9 — Template coverage**
Reads `templates/template-index.md (framework templates, in node_modules)`. For each file type that exists in the project, confirms a template entry exists. Flags any file types without templates.

**Dimension 10 — Parent-backlink integrity**
For every addendum conclusions file in `output/` (filename contains `addendum-NN`):
- Finds the parent conclusions file (e.g., `output/phase-NN-poc-NN-[parent]-conclusions.md`)
- Confirms the parent has an `## Addendums` section with a link to this addendum
- If the section is missing or the link is absent → flags: *"Parent-backlink missing: [parent file] has no link to [addendum file]"*

**Dimension 11 — Alignment verification coverage**
For every Complete conclusions file in `output/` (`**Status:** Complete`):
- Reads the `**Alignment verified:**` field
- If the field is absent or empty → flags: *"Alignment unverified: [file] — run `/conclusions-review` or confirm inline alignment and set the field manually."*
- If the field is present with a date → passes
This dimension ensures conclusions files don't accumulate without being cross-checked against the system state. A full set of empty fields after several POCs is a signal that system drift has gone undetected.

**Dimension 12 — Partial-update scan**
For each wiki/project/ or wiki/standards/ file whose `**Last updated:**` date falls within the current audit window (since the previous audit date, or since the start of the current phase if no prior audit exists):
1. Read the full file — all sections.
2. Collect every named artifact referenced anywhere in the file: tool names, script filenames, library names, pipeline step names, track names (e.g., parallel solution tracks), status phrases ("POC-confirmed", "superseded", "deferred", "reusable as-is").
3. For each named artifact, check whether any other section in the same file assigns it a contradictory status or description. Flag any inconsistency — even if the contradiction is between a recently-updated section and an older one that was not touched.
4. Pay particular attention to: numbered-step sequences (CI/CD blocks, pipeline steps), tables in §1 that may not reflect prose updates in later sections, and sub-bullets within a multi-part section where only some bullets were updated.
*Rationale:* When a file is partially updated, only the targeted sections change. Adjacent or parallel sections referencing the same artifacts often retain the pre-update state. These intra-file partial-update contradictions are invisible to Dimension 1 (cross-file) and Dimension 3 (decisions tracker / version numbers) but are a reliable source of reader confusion and implementation errors.
*Example:* a wiki file's `§7` is updated to a new approach while its `§1 table` still lists the old tool as the primary pipeline tool — same file, different sections, contradictory claims. Another file's `§4b` is updated with a caveat while `§4a` one paragraph above still says "POC-confirmed, reusable as-is."

**Dimension 13 — Concept outgrowth / file splitting**
For each wiki/project/ and wiki/standards/ file, scan every H2/H3 section. Flag sections that show ≥ 2 of the following signals:

1. **Length imbalance**: section word count is more than 2× the median section length for that file
2. **Scope mismatch**: the section's topic is not clearly encompassed by the parent file's stated purpose (read from the first paragraph or `## Overview`/`## Purpose` heading)
3. **POC-hosted content**: the section references a specific POC conclusion as its primary source and is living as a subsection inside a general-purpose file (e.g., a full "Token Pipeline Validation" section inside `tech-stack.md`)
4. **Cross-reference magnet**: 3 or more other project files link directly to this specific section (by heading anchor) rather than to the parent file as a whole

For each flagged section, recommend one of:
- **Promote**: extract to its own wiki file, leave a one-line stub + link in the parent
- **Relocate**: move to a more appropriate existing file (name the target file and section)

*Rationale:* As POC conclusions are incorporated, targeted sections inside general files grow disproportionately. Over multiple sessions this accumulates into files where one section dominates. The section becomes the real reference doc and the parent file becomes an awkward wrapper. Dimension 13 catches this pattern before it requires a large restructure.

**Dimension 14 — Content-type boundary audit**
For each `wiki/project/` file, scan every H2/H3 section against the content rules in `system-operations.md (framework wiki, in node_modules) §4`. Flag any section matching these patterns:

(a) **Removed-tool documentation**: section documents API inventory, output schema, or session discipline for a tool explicitly marked ⚠️ removed — more than a one-line pointer with a deprecation marker
(b) **Standards-level justification**: section contains paragraphs arguing a choice is correct by appeal to industry patterns, external comparisons, or general best practices rather than project-specific reasons. Signature phrases: "this is the standard for…", "[a major library] does it this way…", "[the framework] itself uses…"
(c) **POC findings embedded**: section is titled "POC Findings", "Summary", or equivalent and contains session-specific data (dates, step logs, delta items) that already exists in `findings/`
(d) **Planning stubs**: section has only ⏳ status markers, "pending", or "TBD" with no decided content — no specifications, no configurations, no operational guidance
(e) **Intra-wiki duplication**: the exact same sub-topic (named artifact + description) appears in two `wiki/project/` files with overlapping or contradictory detail

For each flagged section: file path, section heading, violation type (a–e), recommended action (delete / collapse to pointer / move to findings/ / move to wiki/standards/).

---

## Output

Creates: `tmp/phase-NN-knowledge-audit-YYYY-MM-DD.md`

With metadata:
```
**Created:** YYYY-MM-DD
**Author:** AI
**Closes when:** All proposed actions reviewed and approved changes executed
**Status:** Active
```

Report structure:
```
## Issues Found
[Dimension] | [File — §Section] | [Description]

## Proposed Actions
[File(s)] | [Action type] | [What to do]

## Dependency Order
Which fixes must happen before others

## tmp/ Files Ready for Cleanup
[filename] | [Closes when condition] | [Met? Yes/No]
```

## Constraints

- No auto-execution on any finding
- All proposed actions require human review before implementation
- Output goes to tmp/ — not findings/ or output/
