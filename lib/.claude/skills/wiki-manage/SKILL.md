---
name: wiki-manage
description: Manage the lifecycle of wiki files: add, update, or deprecate content. All operations are propose-then-approve — nothing executes without human sign-off.
compatibility: Claude Code
---
# /wiki-manage

Manage the lifecycle of wiki files: add new content, update existing content, or deprecate stale content. All operations are propose-then-approve — nothing executes without human sign-off.

## When to use
- After a conclusions file is written and wiki sections need updating
- When a new wiki page is needed to capture stable knowledge
- When wiki content is stale, contradictory, or orphaned
- As a follow-up to `/knowledge-audit` findings
- When content in one file belongs in another — wrong layer (project/ vs standards/ vs findings/) or cross-file duplication where one file should be the canonical home

## Sub-commands

### /wiki-manage add

**When:** New stable knowledge needs a home — a decision was confirmed, a new process established, a new tool documented.

**Steps:**
1. Librarian reads `CONTENT_INDEX.md` and relevant wiki files to confirm the content doesn't already exist elsewhere (prevent duplication)
2. Librarian identifies: new page, or new section in an existing page?
3. Writer drafts the new content following the correct wiki format (header with Last updated, Status, scope statement; standard heading hierarchy)
4. **Human reviews draft before any file is created**
5. On approval: Writer creates or updates the file, adds/updates CONTENT_INDEX.md entry, appends to log.md
6. Librarian flags if this is a structural addition that triggers Rule 10 (meta-doc update)

---

### /wiki-manage update

**When:** A wiki section is outdated — a decision closed that it described as open, a version changed, a process evolved.

**Steps:**
1. Librarian identifies the specific section(s) to update and what changed (sourced from conclusions file or confirmed decision)
2. Writer drafts the surgical change — only the relevant section(s), no restructuring, no scope creep
3. Writer updates `**Last updated:**` date in the file header
4. **Human reviews the diff before any file is changed**
5. On approval: Writer applies the change, updates CONTENT_INDEX.md entry if key facts changed, appends to log.md
6. Librarian validates: does the update introduce contradictions with any other wiki file?

---

### /wiki-manage deprecate

**When:** A wiki file or section is stale, superseded, or orphaned (nothing links to it and it's not actively referenced).

**Steps:**
1. Librarian identifies the content with specific rationale: what makes it stale, what supersedes it, what links to it (if anything)
2. Librarian proposes the action: archive to `_archive/` vs. merge into another file vs. delete outright
3. **Human reviews the proposal and approves the specific action**
4. On approval:
   - Writer moves to `_archive/` subdirectory (or merges/removes as approved)
   - Removes from `CONTENT_INDEX.md`
   - Updates any incoming links to point to the archive or replacement
   - Appends to log.md with reason

---

---

### /wiki-manage move

**When:** Content in one file belongs in another — wrong layer (project/ vs standards/ vs findings/) or cross-file duplication where one file should be the canonical home.

**Steps:**
1. Librarian identifies: source file + section, destination file + section, and the pointer stub that replaces the moved content in the source
2. Librarian confirms destination does not already contain the content
3. Writer drafts: (a) content formatted for the destination file's style, (b) pointer stub for the source
4. **Human reviews both the moved content and the pointer stub before any file is changed**
5. On approval:
   - Writer inserts content into destination file
   - Writer replaces source section with pointer stub
   - Writer updates `**Last updated:**` in both files
   - Writer updates CONTENT_INDEX.md for both files if key facts changed
   - Writer appends to log.md: `move | source/file.md §N → destination/file.md §M | reason`
6. Librarian validates: pointer stub resolves (check-links.sh catches broken links at Stop time)

**Pointer stub format:**
> [Brief description of what was here] → full detail in `[destination file] §[section]`

**Move to findings/ special case:** If the moved content already exists in a `findings/` file, write a pointer to that file rather than moving the content. Confirm the findings/ file exists before removing source content.

---

### /wiki-manage promote

**When:** A finding is trustworthy and stable enough to inform the wiki without waiting for the full conclusions pipeline. Most common: signal assessment that directly resolves a wiki question, research results that are unambiguously true, mid-POC confirmed fact that corrects an existing wiki entry.

**Arguments:** `[findings-file] → [wiki-file] §[section]`

**Steps:**
1. Librarian reads both the source findings file and the target wiki section in full
2. Librarian drafts the proposed wiki change — conservative, minimum needed, no interpretation beyond what the finding states
3. Librarian presents the proposal with three parts:
   - Source evidence (excerpt from findings file)
   - Proposed wiki diff (what would change)
   - Confidence note: *"This is sourced from a findings file, not conclusions. The entry will carry ⚡ until formally confirmed by a conclusions review."*
4. **Human reviews and explicitly approves both the source → wiki mapping AND the drafted content**
5. On approval: Writer updates wiki file, inserts confidence marker inline:
   ```
   ⚡ *Source: [findings-file-path] — pending formal conclusions. Clear when `/conclusions-review` confirms.*
   ```
6. Writer updates `**Last updated:**` date, appends to `log.md`
7. Librarian adds the wiki entry to a session tracking note: "wiki entries pending confirmation: [file §section]"

**Clearing the marker:** When `/conclusions-review` or `/activity-conclude` processes the related activity and conclusions confirm the wiki entry → marker is removed. If conclusions contradict → entry is corrected and marker is removed with a correction note.

**Constraint:** Promote never creates a new wiki file — only updates an existing section. New wiki files require full `/wiki-manage add` with a conclusions source.

---

## Constraints

- **No wiki file is touched without human review and explicit approval**
- **No restructuring during updates** — change only what was specified
- **No deletion without archive** — content moves to `_archive/` unless explicitly approved for removal
- **`move` preserves a pointer stub** — source sections are never silently removed; a one-line pointer to the destination always replaces the moved content
- **Librarian validates every change for contradictions** before execution
- **All changes logged** — every create, update, deprecate, and move gets a log.md entry
