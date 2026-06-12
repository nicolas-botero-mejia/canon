# System Template Standards

**Last updated:** 2026-06-12
**Scope:** Template philosophy, naming conventions, the two template categories, and how to add new templates. Companion to `template-index.md` (which maps every existing template to its destination and usage).

---

## What templates are for

Templates exist so that new activity files are consistent — same sections, same metadata fields, same structural conventions — across all engagements and all contributors. The AI (Writer agent) uses knowledge templates when creating new files. Scripts use script templates when scaffolding automation outputs.

Templates are **not** documentation. They live in `lib/templates/` because they're action artifacts, not methodology docs.

---

## Two template categories

### Knowledge templates — copy, rename, fill

Used by the Writer agent and team when starting a new activity or creating a new document.

**Pattern:** `[process-type].[file-type]-template.md`

| Part | Examples |
|------|---------|
| `process-type` | `poc`, `research`, `addendum`, `session`, `signal`, `handoff`, `tmp` |
| `file-type` | `plan`, `notes`, `results`, `conclusions`, `field-notes` |

**How they're used:**
1. Writer agent copies the template to the target folder
2. Renames following the canonical naming convention (`phase-NN-[type]-[identifier]-[file-type].md`)
3. Fills in the `{{fields}}` with session/activity context
4. Human reviews before the file is indexed

**Authorship:** Mixed — AI fills structure and known facts; human validates and adds nuance. Some files (like `session.field-notes-template.md`) are human-authored only.

Full destination rules → `template-index.md`.

---

### Script templates — sed-interpolated

Used by governance scripts for automated scaffolding. Never filled in manually.

**Pattern:** `[output-name]-template.md` (no `process-type` prefix — these aren't activity files)

**`{{PLACEHOLDER}}` syntax:** All variable sections use double-curly-brace placeholders. The calling script runs `sed -e "s/{{PLACEHOLDER}}/value/g"` to produce the output file.

**Current script templates:**

| File | Used by | Scaffolds |
|------|---------|-----------|
| `phase-index-template.md` | `scripts/phase-transition.sh` | New phase index (decisions tracker, risk register, session mapping, phase gate checklist) |

**How they're used:** The script resolves the template path relative to its own location (`${SCRIPT_DIR}/../templates/phase-index-template.md`), runs sed substitution, and writes the output to the target location in the consumer project.

---

## Naming convention rationale

Knowledge templates follow `[process-type].[file-type]-template.md`:
- **Dot separator** between process-type and file-type: makes the type hierarchy visually scannable and sorts by process-type in directory listings
- **`-template` suffix**: unambiguous — never confused with actual activity files
- **No phase number**: templates are reusable across phases

Script templates follow `[output-name]-template.md`:
- **No process-type prefix**: they don't map to an activity lifecycle
- Same `-template` suffix for consistency

---

## How to add a new knowledge template

**When:** A new activity type is added (new process-type), or a new file type is needed within an existing activity.

**Steps:**
1. Create `[process-type].[file-type]-template.md` in `lib/templates/`
2. Add a row to `template-index.md`:
   - Template name, destination folder, when to use, who authors it (Human / AI / Mixed)
3. Update `system-index.md` activity lifecycle table if a new process-type was added
4. Update `system-operations.md` if naming conventions change
5. Add the process-type to `behavioral.md` Rule 9 examples if it's a new top-level type
6. Functional test: have the Writer agent use the template and verify the output structure

**Template content requirements:**
- Header: `# [descriptive title]` with fill-in `[brackets]` for variable fields
- Metadata block: `**Phase:** [NN]`, `**Date:** [YYYY-MM-DD]`, `**Status:** [status]`
- All variable fields use `[brackets]` (not `{{curly braces}}` — that's for script templates)
- Footer with tier reminder (which tier this file belongs to and what comes next)

---

## How to add a new script template

**When:** A script needs to scaffold a new type of file.

**Steps:**
1. Create `[output-name]-template.md` in `lib/templates/`
2. Use `{{PLACEHOLDER}}` syntax for all variable sections
3. Update the script to resolve and sed-interpolate the new template
4. Document in `system-architecture.md §4` (Script templates table)
5. Update `template-index.md` with a row (mark authorship as "Script" not "AI" or "Human")

---

## YAML frontmatter convention

### When frontmatter is used

Frontmatter is added to template-generated files where cross-file filtering queries require it — specifically files in `findings/` and `conclusions/` (where many files accumulate over a project), and `plans/phase-NN-index.md` files. Frontmatter is NOT added to wiki files, templates, or plans/scripts.

### Schema

**`findings/*.md`** (results, notes, signal, field-notes):
```yaml
---
type: poc-results | research-results | signal-results | session-results | field-notes | addendum-results | handoff
phase: "NN"
topic: "[slug]"
status: in-progress | complete
author: AI | Human | Mixed
date: "YYYY-MM-DD"
# signal-results only:
discovery_type: external | internal
---
```

**`conclusions/*.conclusions.md`**:
```yaml
---
type: poc-conclusions | research-conclusions | session-conclusions
Note: addendum conclusions are not standalone files — they are sections appended to the parent
POC conclusions file. The append-section structure is defined in addendum.conclusions-section-template.md
(renamed from addendum.conclusions-template.md). See ADR-010 in system-decisions.md.
phase: "NN"
topic: "[slug]"
status: in-progress | complete
alignment_verified: "" | "YYYY-MM-DD"
---
```

**`plans/phase-NN-index.md`**:
```yaml
---
type: phase-index
phase: "NN"
status: active | concluded
---
```

**Wiki files with ⚡ markers** (added only when `/wiki-manage promote` is used, removed when marker clears):
```yaml
---
pending_confirmation:
  - section: "§N — Section Title"
    source: "findings/phase-NN-signal-NN-slug-results.md"
---
```

### Index projection fields (ADR-021)

Every monitored-dir template additionally carries the CONTENT_INDEX projection fields, read by `canon index` to generate the project layer:

```yaml
description: ""        # one line — becomes the entry (lightweight form) or **What it is:** (full form)
key_facts: []          # string list — full four-part entry requires all three fields
questions: []          # string list — **Questions it answers:**
noindex: true          # optional opt-out — file is never projected into the index
```

Empty `description` = not indexed (check-index flags the file at session close — fill the field and re-run `canon index`, or hand-write an entry outside the index's generated markers). A full four-part entry requires **all three** fields non-empty; `description` alone renders the lightweight one-liner form (the two-form contract — partial combinations render lightweight with a generator warning). `wiki/client/` + `wiki/user/` files never carry frontmatter (ADR-012) — `canon index` falls back to their H1 title.

### Key constraints

- All date fields are strings (`"2026-06-06"`) not YAML date type — avoids timezone issues
- Frontmatter is at the top of the file, before the `#` heading
- Fields use `snake_case`
- Only `type` is required — other fields are strongly recommended
- MCP tools (`query_findings`, `query_conclusions`, etc.) read these fields for filtering
- Frontmatter is a flat canon dialect (string scalars, block string lists, booleans) — no nesting beyond the `pending_confirmation` wiki marker; `canon index` parses exactly this subset

---

## What does NOT belong in templates

- **Framework docs** — go in `lib/wiki/`
- **Actual activity files** — go in `plans/`, `findings/`, or `conclusions/` in the consumer project
- **Consumer project content** — never in the package at all
- **Configurable wiring** — goes in `manifest.json` or the CLI commands
