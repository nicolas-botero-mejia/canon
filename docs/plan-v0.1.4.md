# Canon v0.1.4 — Wiki Expansion, Signal Model, Tool Separation, Folder Rename

**Builds on:** v0.1.3 (stable, published)
**No consumers exist — all structural changes are safe.**

---

## What this plan solves

| Problem | Root cause |
|---------|-----------|
| `output/` conflates team-internal synthesis with client-facing artifacts | `conclusions/` and `deliverables/` are distinct audiences; one folder creates ambiguity about what is shareable |
| No dedicated folder for client-facing deliverables | Slide decks and formal recommendations land in `output/` alongside internal POC synthesis |
| Wiki only has `project/` and `standards/` | Client org knowledge and end-user research have no home |
| Signals are external-only | No way to capture mid-activity insights or cross-POC patterns |
| Findings can only reach wiki through the full conclusions pipeline | No fast path for trustworthy findings that don't warrant a full activity close |
| Tool-specific content embedded in architecture and methodology docs | Adding a new tool requires touching docs that describe the system, not the tool |
| No dedicated session plan template | `activity-new` says "adapt poc template" — that's a workaround |
| `**Last updated:**` fields carry verbose changelogs | Changelog belongs in `system-decisions.md`, not wiki headers |
| §8 in `system-architecture.md` is a thin table | Cloud/GitHub migration path deserves real coverage |

---

## Decisions locked

| Question | Decision | Rationale |
|----------|----------|-----------|
| `output/` → `conclusions/` rename | Rename | `conclusions/` is precise; `output/` is semantically empty. Three-tier model becomes explicit: `findings/ → conclusions/ → deliverables/`. No consumers — safe to rename now. |
| `deliverables/` folder | Add as user-owned, scaffolded by `init` | Client-facing artifacts (slides, formal recommendations, handoff specs) are distinct from internal synthesis by audience and confidentiality. Both land in `output/` today — ambiguous. |
| `wiki/client/` and `wiki/user/` — user-owned or vendored? | User-owned, scaffolded by `init` | These hold project knowledge, not framework content. Same model as `wiki/project/` and `wiki/standards/`. Not in manifest.json. |
| `raw/` as source for wiki layers | Valid source, human-approved | Client org charts, user research reports, industry standards documents arrive via `raw/` and are valid seeds for `wiki/client/`, `wiki/user/`, and `wiki/standards/`. Quality gate: human approval, same as `/wiki-manage promote`. No conclusions file required. |
| Preferences file? | No — wiki IS the preference system | Natural language wiki is more expressive than JSON keys. Behavioral rules in `behavioral.md` already serve as the framework rule layer. No new mechanism needed. |
| Signal sub-types | Internal + External | Current template assumes external-only. Internal signals (mid-activity insights, cross-POC patterns) are the primary unhandled case. |
| `/signal` skill | Standalone, always-available | Must not require an open activity. Target: 2-minute capture, no friction. |
| Findings → wiki fast path | `/wiki-manage promote` sub-command | Human gate required (no conclusions gate). Confidence marker on wiki entry until formally confirmed. |
| Tool integration separation | `system-tool-integration.md` (new) | Tool integration is consumption, not architecture. Separate file allows adding tools without editing architecture docs. |
| `session.plan-template.md` | Create dedicated template | Sessions have a distinct structure (Agenda, Decisions, Observation Checklist). Not a POC adaptation. |
| `**Last updated:**` format | Date only | Verbose changelog belongs in `system-decisions.md`. The date serves the meta-doc currency audit; the context is noise there. |
| Three-tier model note | Add fast-path exception | The system-index note "nothing skips a tier" is too absolute. `/wiki-manage promote` is a documented exception — different lane, human gate, confidence marker. |

---

## Step 0 — Structural folder changes

### 0a. Rename `output/` → `conclusions/`

`output/` is semantically empty — it could mean anything the system produces. `conclusions/` is precise: synthesized decisions and verdicts from activities. The three-tier model becomes explicit: `findings/ → conclusions/ → deliverables/`.

**Approach:** Batch find-replace `output/` → `conclusions/` across all `lib/` source files, then handle the init and example directories.

**Files requiring update (38 files — all in `lib/`):**
- `lib/.claude/agents/librarian.md`, `pm.md`, `writer.md`
- `lib/.claude/rules/behavioral.md`
- All `lib/.claude/skills/*/SKILL.md`
- All `lib/templates/*.md` (destination path references — e.g. `output/phase-NN-poc-...` → `conclusions/phase-NN-poc-...`)
- `lib/wiki/system-architecture.md`, `system-index.md`, `system-operations.md`, `system-principles.md`, `system-template-standards.md`
- `lib/CLAUDE.base.md`
- `lib/scripts/check-conclusions-alignment.sh`, `post-write-check.sh`, `session-start-report.sh`

**`bin/commands/init.mjs`** — replace `'output'` with `'conclusions'` in USER_DIRS.

**`examples/consumer/`** — rename the `output/` directory to `conclusions/`.

**Verification:**
```bash
grep -r "\boutput/" . \
  --include="*.md" --include="*.mjs" --include="*.sh" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.git
```
Must return 0 results. (Exception: any prose reference to "output" as a concept without a trailing `/` is fine — only the path form matters.)

Add one ADR entry to `system-decisions.md` recording the rename and rationale.

---

### 0b. Add `deliverables/` folder

Client-facing artifacts are distinct from team-internal synthesis by audience, polish, and confidentiality. Keeping both in `conclusions/` (formerly `output/`) creates ambiguity about what is shareable with the client.

**What belongs in `deliverables/`:**
- Slide decks and presentations
- Formal recommendation documents
- Design system documentation packaged for client handoff
- Architecture briefs addressed to the client
- Accessibility audit reports delivered to the client
- Phase-end synthesis formatted for client consumption

**What does NOT belong:**
- POC conclusions, session conclusions, phase synthesis, research conclusions → all stay in `conclusions/` (team-internal)
- Findings or evidence → `findings/`
- Received source material → `raw/`

The rule: if the client receives it as a formal artifact, it goes in `deliverables/`. If only the team reads it, it goes in `conclusions/`.

**`bin/commands/init.mjs`** — final USER_DIRS after both 0a and 0b:
```js
const USER_DIRS = [
  'plans', 'findings', 'conclusions', 'raw', 'tmp', 'deliverables',
  'wiki/project', 'wiki/standards', 'wiki/client', 'wiki/user',
  'scripts/project',
]
```

**`examples/consumer/deliverables/README.md`** — create:
```
# deliverables/

Client-facing formal artifacts — what the client receives.
Distinct from conclusions/ (team-internal synthesis — the team reads these).

See system-operations.md (framework wiki, in node_modules) §4 for content rules.
```

**`lib/CLAUDE.base.md`** — add to folder map under `output/` (now `conclusions/`):
```
deliverables/       → Client-facing formal artifacts (slide decks, formal recommendations,
                      design specs for handoff). Distinct from conclusions/ (team-internal).
```

**`lib/wiki/system-operations.md` §4** — add after the `conclusions/` section:

```
### deliverables/
✅ Belongs: Client-facing formal artifacts — what the client receives as a packaged document.
   Slide decks, formal recommendations, design system specs for handoff, architecture briefs
   addressed to the client, accessibility audit reports delivered to the client.
❌ Never: Team-internal synthesis (→ conclusions/), findings or evidence (→ findings/),
   source material received (→ raw/).
```

**`lib/wiki/system-operations.md` §14 Trigger Events table** — add `deliverables/` column. Add row:

| Event | deliverables/ | log.md |
|-------|--------------|--------|
| Deliverable created or updated for client | ✅ | ✅ |

**`lib/.claude/rules/behavioral.md` Rule 6** — add `deliverables/` to file routing:
```
conclusions/   → synthesized activity conclusions (POC, session, research, addendum — team reads)
deliverables/  → client-facing formal artifacts (presentations, formal recommendations, handoff specs)
```

**`lib/.claude/agents/librarian.md`** — add `deliverables/` to knowledge base structure:
```
deliverables/ → client-facing formal artifacts (what the client receives)
```

**`lib/wiki/system-index.md` Three-Tier Capture Model** — update diagram and description:

Change tier 3 line from `output/*-conclusions.md` to `conclusions/*-conclusions.md`. Extend diagram:

```
conclusions/*-conclusions.md ← decisions, verdicts, wiki triggers (tier 3: stable knowledge)
  ↓  package for client
deliverables/               ← client-facing formal artifacts (presentations, formal specs)
```

Update the "When to use each tier" entry for `conclusions/` to read "synthesized decisions and verdicts. Triggers wiki updates." Add an entry for `deliverables/`: "packaged client-facing artifacts derived from conclusions. Not part of the knowledge synthesis chain."

**`lib/wiki/system-index.md` Activity Lifecycle table** — all Destination entries that said `output/` now read `conclusions/`.

**`lib/wiki/system-index.md` — add conceptual layer framing block** above the Activity Lifecycle table:

```
## Conceptual Layers

The folder structure maps to five conceptual layers. Read this before the activity table below.

| Layer | Folders | What lives there |
|-------|---------|-----------------|
| **Input** | `raw/` | Received materials — immutable, never edited |
| **Process** | `plans/` · `findings/` · `conclusions/` | Engagement work: plan → execute → synthesize |
| **Knowledge** | `wiki/` | Accumulated stable reference knowledge |
| **Output** | `deliverables/` | Client-facing formal artifacts |
| **Transient** | `tmp/` | Lifecycle-limited working files |

The Process layer stays three folders — not one — because the folders enforce the pipeline direction
and separate living documents (`plans/`) from immutable artifacts (`findings/`, `conclusions/`).
Full rationale → `system-architecture.md §1.3`
```

**`lib/templates/template-index.md`** — all `Destination folder` entries from `output/` → `conclusions/`.

---

## Step 1 — Quick cleanup

### 1a. Strip verbose `**Last updated:**` fields

Replace the inline changelog with just the date in all wiki files:

```
Before: **Last updated:** 2026-06-06 (v0.1.3 restructure — payload/ → lib/; ...)
After:  **Last updated:** 2026-06-06
```

Files: `lib/wiki/system-architecture.md`, `system-decisions.md`, `system-index.md`,
`system-operations.md`, `system-principles.md`, `system-template-standards.md`, `system-verification.md`

Add one ADR entry to `system-decisions.md` noting that verbose headers were removed and that `system-decisions.md` is now the canonical changelog.

### 1b. Add §1.3 to system-architecture.md — Knowledge Layer Model

Insert as a new section after §1.2 (Session Lifecycle). This is the structural rationale layer: why the folders are shaped the way they are. The intellectual lineage (Karpathy comparison) stays in `system-operations.md §3` — this section cross-references it rather than duplicating it.

**Content:**

```markdown
### §1.3 — Knowledge Layer Model

The folder structure maps to five conceptual layers. Each layer has a distinct role and a
distinct immutability contract:

**Input** (`raw/`) — What you receive. Authored by others, arrived from outside.
Immutable — never edited, never generated, never synthesized. Transcripts, client documents,
third-party source material. The "raw" name is intentional: it signals the no-touch contract.

**Process** (`plans/` · `findings/` · `conclusions/`) — What you do.
Three folders, not one, because they have different lifecycles and different roles in the pipeline:

| Folder | Content | Lifecycle | Direction |
|--------|---------|-----------|-----------|
| `plans/` | Session guides, decisions tracker, roadmaps | Living — edited continuously | Prospective (what will happen) |
| `findings/` | Field notes, results files, signals, handoffs | Append-only — created during activity, not edited after | Retrospective (what was observed) |
| `conclusions/` | Synthesized verdicts, decisions closed, wiki triggers | Immutable after synthesis | Retrospective (what it means) |

The folders enforce the pipeline direction: `plans/` precedes work, `findings/` captures work,
`conclusions/` synthesizes work. Collapsing them would remove structural enforcement — the
scripts (check-conclusions-alignment, session-start-report) and skills (/activity-conclude,
/conclusions-review) use folder location as a pipeline stage signal, not just the filename suffix.

**Knowledge** (`wiki/`) — What compounds.
Stable reference that persists and grows across the engagement. Sourced from `conclusions/` (and
from `raw/` for wiki/client/, wiki/user/, wiki/standards/ — with human approval).
Not raw, not findings, not output — the layer that makes each session more productive than the last.

**Output** (`deliverables/`) — What the client receives.
Packaged formal artifacts derived from conclusions. Different audience, different polish, different
confidentiality than conclusions. Not part of the knowledge synthesis chain — a presentation
created from conclusions stays in `deliverables/` and does not feed wiki.

**Transient** (`tmp/`) — What gets cleaned up.
Lifecycle-limited working files. Each has a `**Closes when:**` condition. Not indexed, not linked,
not permanent knowledge. Cleaned when the condition is met.

For intellectual lineage (how this maps to Karpathy's model and ResearchOps patterns) →
`system-operations.md §3`. For content rules (what belongs in each folder) → `system-operations.md §4`.
```

---

### 1c. Expand §8 in system-architecture.md

Current §8 is four rows in a table. Expand to cover:

- **Multi-repo workflow** — consumer project and framework package are separate repos. How the `node_modules/` boundary is maintained.
- **CI enforcement** — which Stop hook checks move to CI (check-index, check-links, check-stale-refs) and which stay local-only (watch-project). Recommended CI trigger: push to `wiki/` or `plans/`.
- **Branching** — `main` is always publishable. Feature branches for structural changes. Tag `v0.1.x` on publish.
- **CD pipeline** — `npm publish` triggered manually after `npm test` passes. No automatic publish on push.
- **Consumer `.gitignore` for CI** — `tmp/` never committed. `raw/` may be gitignored for client confidentiality. `.framework-version` IS committed (version pinning contract).

---

## Step 2 — session.plan-template.md

Create `lib/templates/session.plan-template.md`.

Session plans are structurally different from POC plans:

| POC plan | Session plan |
|----------|-------------|
| Hypotheses table (H1–HN) | Key Decisions table (what must close this session) |
| Execution Steps | Agenda (time \| item) |
| External Validation step | Prep Before This Session |
| Success Criteria per hypothesis | Questions section (priority table: ★ / —) |
| — | Observation Checklist (shadowing variant, replaces Agenda) |

**Mandatory sections in every session plan:**
1. `**Goal:**` — one sentence, what this session must accomplish
2. `## Prep Before This Session` — what to prepare in advance (client-facing sessions)
3. `## Agenda` OR `## Observation Checklist` (mutually exclusive)
4. `## Key Decisions` OR `## Questions` (mutually exclusive)
5. `## Outputs to Capture` — checklist of required artifacts
6. `## After the Session` — file paths + update instructions

**Template header:**
```
**Phase:** NN
**Session:** NN
**Topic:** [slug]
**Date:** YYYY-MM-DD
**Duration:** [duration]
**Participants:** [who attends]
**Type:** Client | Internal | Shadowing
**Goal:** [one sentence]
**Last updated:** YYYY-MM-DD
**Author:** AI

> For phase-blocking gaps, risk register, decisions tracker → [phase-NN-index.md](./phase-NN-index.md)
```

**After creating the template:**
- `lib/templates/template-index.md` — add `session.plan-template.md` row to Template → File Mapping table
- `lib/templates/template-index.md` Process Types table — update `session` row: plan column now explicitly lists `session.plan-template.md`
- `lib/.claude/skills/activity-new/SKILL.md` Step 4 — replace "use `poc.plan-template.md` adapted for sessions" with "use `session.plan-template.md`"

---

## Step 3 — Wiki layer expansion

### 3a. New wiki layers defined

**`wiki/client/`** — organizational knowledge about the client. Distinct from project decisions. Things that are true of the client regardless of what was decided together.

```
✅ Belongs:
  - Org structure: key stakeholders, their roles, reporting lines
  - Communication preferences: async vs sync, document format preferences (deck vs doc)
  - Decision-making dynamics: who has final authority, who influences, how decisions get made
  - Political constraints: known tensions, budget pressures, timing constraints
  - Engagement context: contract scope, timeline, key milestones

❌ Never:
  - Client decisions about the project (→ wiki/project/)
  - Session-specific observations (→ findings/)
  - Sensitive commercial or personal information
```

**`wiki/user/`** — end user research accumulated across the engagement.

```
✅ Belongs:
  - Personas: who end users are, their roles and contexts
  - Behavioral patterns observed across sessions and research (synthesized, not session-specific)
  - Pain points and needs that persist across the engagement
  - Accessibility requirements and constraints
  - Mental models and conceptual vocabulary users bring

❌ Never:
  - Session-specific observations (→ findings/)
  - Client org information (→ wiki/client/)
  - Unverified hypotheses (→ plans/ or findings/)
```

**Update cadence:** Both layers update rarely — at relationship events, after research activities, or when a concluded session materially changes the understanding. Not updated every session.

### 3b. Changes to make

**`bin/commands/init.mjs`** — the final USER_DIRS after all Step 0 changes is defined in Step 0b. This step requires only that `wiki/client` and `wiki/user` are present — Step 0b covers the complete list.

**`examples/consumer/wiki/client/README.md`** — create:
```
# wiki/client/

Organizational knowledge about the client — who they are, how they operate, how decisions get made.
Empty in the framework template. Populate per engagement.

See system-operations.md (framework wiki, in node_modules) §4 for content rules.
```

**`examples/consumer/wiki/user/README.md`** — create (same pattern, user research description).

**`lib/CLAUDE.base.md`** — add `wiki/client/` and `wiki/user/` to the folder map section.

**`lib/wiki/system-operations.md` §4 "What Lives Where"** — add two new sections between `wiki/project/` and `wiki/meta/`:

```
### wiki/client/
✅ Belongs: Org knowledge — stakeholders, communication preferences, decision-making dynamics,
   political constraints, engagement context. True of the client regardless of project decisions.
   Valid sources: raw/ documents (org charts, client briefs), session results files, field notes —
   with human approval. No conclusions file required.
❌ Never: Project decisions (→ wiki/project/), session observations (→ findings/),
   sensitive personal or commercial information.

### wiki/user/
✅ Belongs: End user knowledge synthesized across activities — personas, behavioral patterns,
   pain points, accessibility requirements, mental models.
   Valid sources: raw/ documents (user research reports, usability study outputs), research results,
   session results — with human approval. No conclusions file required.
❌ Never: Session-specific observations (→ findings/field-notes.md),
   client org information (→ wiki/client/), unverified hypotheses (→ plans/).
```

Also update `wiki/standards/` entry to note raw/ as a valid source:

```
### wiki/standards/
Valid sources: industry standards documents, published research, authoritative external references
arriving via raw/. Human approval required before populating from raw/.
```

**`lib/wiki/system-operations.md` §14 Trigger Events table** — add two rows (after wiki/client/ and wiki/user/ sections are defined in §4):

| Event | wiki/client/ | wiki/user/ | log.md |
|-------|-------------|------------|--------|
| Client relationship event or org change (new stakeholder, scope revision, decision-making shift) | ✅ | ❌ | ✅ |
| Research or session produces synthesized user insights | ❌ | ✅ | ✅ |

Also add a `deliverables/` column for the row "Deliverable created or updated for client → deliverables/ ✅, log.md ✅" (coordinates with Step 0b).

**`lib/.claude/rules/behavioral.md` Rule 6** — update File Routing to mention all four wiki layers:
```
wiki/project/  → client decisions (what was chosen)
wiki/client/   → org knowledge (who the client is, how they operate)
wiki/user/     → user research (who end users are, what they need)
wiki/standards/ → industry patterns (true of any project)
```

**`lib/.claude/agents/librarian.md`** — three updates:

1. Add `wiki/client/` and `wiki/user/` to the knowledge base structure section.
2. **Consistency Dimension 1** — update the scope from `wiki/project/` and `wiki/standards/` to all four active wiki layers: `wiki/project/`, `wiki/standards/`, `wiki/client/`, `wiki/user/`.
3. **Consistency Dimension 8** — extend to cover all four active wiki layers. Add layer-specific boundary rules:
   - `wiki/client/` violations: project decisions embedded (→ `wiki/project/`), session-specific observations (→ `findings/`), sensitive personal/commercial info
   - `wiki/user/` violations: session-specific observations (→ `findings/`), client org info (→ `wiki/client/`), unverified hypotheses (→ `plans/`)
   - `wiki/standards/` violations: project-specific decisions embedded (→ `wiki/project/`), client-specific constraints (→ `wiki/project/`)

**`examples/consumer/CONTENT_INDEX.md`** — add stub sections:
```
## wiki/client/ — Client Organizational Knowledge
Empty in the framework template. Populate per engagement.

## wiki/user/ — End User Research
Empty in the framework template. Populate per engagement.
```

---

## Step 4 — Signal model expansion

### 4a. Update signal.results-template.md

Add discovery type distinction to the header:

```
**Discovery type:** External (article / tool / community / documentation) | Internal (mid-activity insight / cross-activity pattern / synthesis realization)
**Source:** [URL or "Phase NN, [activity type] NN, while [what you were doing]"]
**Related activity (if internal):** [phase-NN-poc/session-NN — in progress / concluded]
```

Replace the `## Source` section with two variants:

**If External:** keep current format (URL, author, publication date, type).

**If Internal:**
```
## Source — Internal Discovery
- **Discovered during:** [Phase NN, Activity type NN, step/moment when it surfaced]
- **What triggered it:** [1–2 sentences on what you were working on when this appeared]
- **Cross-references:** [Other conclusions/POCs/wiki files this connects to]
```

Add to Assessment options:
- [ ] **Wiki update** — this insight directly corrects or enriches a wiki file without needing a full activity. Use `/wiki-manage promote` after completing this assessment.

### 4b. Create /signal skill

`lib/.claude/skills/signal/SKILL.md`

**When to use:** Any time a discovery surfaces that doesn't fit the current activity — or when there is no current activity. Designed for 2-minute capture without interrupting what you're doing.

**Arguments:** `<slug>` (required): a 2–4 word identifier for the discovery.

**Steps:**

**Step 1 — Capture**
Ask for a brief description of the discovery (2–3 sentences, rough is fine). Ask: is this External (came from outside the project) or Internal (surfaced while doing project work)?

**Step 2 — Route check**
- Ask: "Does this extend a specific closed parent document (a POC, research, or session you can name)? [y/N]" — default is N.
- If yes: "That sounds like an addendum candidate. Run `/activity-new addendum [parent]` instead — signals are for discoveries with no clear parent. Proceed as signal anyway? [Y/n]"
- If no (default), or user confirms signal anyway → proceed.

Rationale: most signals arrive here precisely because the user already determined there's no clear parent (Rule 11's gate). The route check should be a low-friction confirmation, not a primary question that fires skeptically on every signal.

**Step 3 — Classify assessment**
Based on the description, suggest one of the assessment options from `signal.results-template.md`. Present as a recommendation, not a decision — human confirms.

**Step 4 — Create results file**
Create `findings/phase-NN-signal-NN-[slug]-results.md` using `signal.results-template.md`. Pre-fill:
- Discovery type (External/Internal) from Step 1
- Source fields filled from the description
- Assessment pre-checked based on Step 3 suggestion

**Step 5 — Add to backlog and log**
- Add entry to `plans/discovery-backlog.md`: signal number, slug, assessment type, date
- Append to `log.md`: `[date] create | findings/phase-NN-signal-NN-[slug]-results.md | Signal captured: [slug]. Assessment: [type].`

**Step 6 — Return routing**
Summarize: *"Signal [slug] captured. Assessment: [type]. Recommended next: [specific action — e.g., 'Run /activity-new addendum poc-02 when ready. No action required now.']"*

**Constraints:**
- Never blocks current work — after Step 6, return control immediately
- Never creates plan or conclusions files — signal.results is the only artifact
- If run during an activity: the current activity stays open; the signal is a parallel capture

**Update `lib/.claude/skills/signal/SKILL.md` reference in:**
- `lib/templates/template-index.md` Process Types table — signal row: add "(Capture via `/signal`)" note
- `lib/wiki/system-index.md` Activity Lifecycle table — signal row: add `/signal` in a new Skill column

### 4c. Update /activity-conclude Step 4

Add a signal prompt at the END of Step 4, after the deferred observations and tool retirement checks:

```
**Signal check (all types):**
"Did anything unexpected surface during this activity that:
 - Connects patterns across multiple prior activities?
 - Challenges an assumption in a wiki file or prior conclusion?
 - Feels important but doesn't fit any hypothesis in this activity?

If yes → run `/signal <slug>` before closing. Takes 2 minutes. Prevents the insight from being lost.
If no → proceed to Step 5."
```

This is advisory, not blocking. Human decides. The prompt fires for all activity types (poc, addendum, research, session).

### 4d. Add /wiki-manage promote sub-command

Add `### /wiki-manage promote` to `lib/.claude/skills/wiki-manage/SKILL.md`.

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

**Update system-index.md Three-Tier Capture note:**

Change: *"Nothing skips a tier."*

To: *"Nothing skips a tier without a human gate. Exception: `/wiki-manage promote` allows a finding to update the wiki directly, with human approval and a ⚡ confidence marker. This is a documented fast path, not a bypass — the marker tracks pending confirmation and is cleared when formal conclusions cover the same ground."*

### 4e. Add /knowledge-audit Dimension 15

`lib/.claude/skills/knowledge-audit/SKILL.md` — add after Dimension 14:

**Dimension 15 — Finding-sourced wiki entries pending confirmation**

Scans all `wiki/project/`, `wiki/client/`, `wiki/user/`, `wiki/standards/` files for the ⚡ marker.

For each found:
- Identify: file, section heading, source findings file referenced in the marker
- Check: has the source activity since concluded? If yes → the marker should have been cleared at `/activity-conclude` or `/conclusions-review` time
- Flag: *"⚡ Unconfirmed wiki entry — [file §section]. Source: [findings-file]. Activity concluded: [Yes/No]. Action: run `/conclusions-review [conclusions-file]` to confirm and clear the marker, or manually verify and remove ⚡."*

No auto-removal. Human confirms before marker is cleared.

### 4f. Update /knowledge-audit Dimensions 1 and 14

**Dimension 1 — Contradictions:** Update scope from `wiki/project/` and `wiki/standards/` to all four active wiki layers: `wiki/project/`, `wiki/standards/`, `wiki/client/`, `wiki/user/`. Contradictions can occur across any combination — e.g., a stakeholder described differently in `wiki/client/` and `wiki/project/`, or a user persona that conflicts between `wiki/user/` and a research finding.

**Dimension 14 — Content-type boundary audit:** Extend to cover all four active wiki layers with layer-specific rules:

| Layer | Content rules reference |
|-------|------------------------|
| `wiki/project/` | Current content rules (client decisions, what was chosen) |
| `wiki/standards/` | Must not contain project-specific decisions or client-specific constraints → flag → `wiki/project/` |
| `wiki/client/` | Must not contain project decisions (→ `wiki/project/`), session-specific observations (→ `findings/`), unverified hypotheses (→ `plans/`), sensitive personal/commercial info |
| `wiki/user/` | Must not contain session-specific observations (→ `findings/`), client org info (→ `wiki/client/`), unverified hypotheses (→ `plans/`) |

Cross-layer boundary violations are flagged with: file, section, violation type, recommended destination layer.

---

## Step 5 — Tool integration separation

### 5a. Create lib/wiki/system-tool-integration.md

This file answers: how does each supported tool consume the framework? It changes when new tools are added. `system-architecture.md` and `system-operations.md` do not change when tools are added.

**Structure:**

```markdown
# System — Tool Integration

**Scope:** How each supported tool consumes the framework — lifecycle events, configuration
format, hook output format, known limitations. Add a new section here when adding a new tool.
The architecture (system-architecture.md) and methodology (system-operations.md) do not change
when a new tool is integrated.

---

## Claude Code

### Lifecycle events
| Event | When it fires | Blocking? |
|-------|--------------|-----------|
| SessionStart | Session opens | No (advisory only) |
| PreToolUse | Before any tool call | Yes — exit 2 blocks |
| PostToolUse | After any tool call | Only via JSON decision (exit 2 alone is non-blocking) |
| Stop | Session ends | Yes — exit 2 blocks close |

### Configuration
`.claude/settings.json` — hooks array under each event name. Written by `canon init`.

### Hook output format
Scripts communicate back to Claude via stdout JSON:
- Advisory: `{ "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." } }`
- Block (PostToolUse only): `{ "decision": "block", "reason": "...", "hookSpecificOutput": {...} }`
- PreToolUse block: exit 2

### Slash command invocation
Skills invoked as `/skill-name` — loaded from `.claude/skills/[name]/SKILL.md`.
Agents invoked as subagents from skills using the Agent tool.

### Known limitations
- PostToolUse: exit 2 alone is non-blocking. Hard blocks require JSON `{ "decision": "block" }` with exit 0.
- PreToolUse: exit 2 blocks. No JSON format needed.
- SessionStart: always advisory — cannot block session open.

---

## Cursor

### Lifecycle events
[To be filled when Cursor integration is implemented]

### Configuration
`.cursor/hooks.json` — written by `canon init` if Cursor layer is enabled.

### Known limitations
[To be filled]

---

## Adding a new tool integration

When adding support for a new AI tool:

1. Add a new `## [Tool Name]` section to this file
2. Document: lifecycle events, configuration format, hook output format, known limitations
3. Create hook scripts in `lib/.cursor/hooks/` (or equivalent for the new tool)
4. Add the tool's config file to `manifest.json` wiring if it needs to be written by `sync`
5. Update `bin/commands/init.mjs` to prompt for the new layer and write config
6. Update `system-architecture.md §3` only if a new *script* is added — not for new tool wiring

`system-architecture.md` and `system-operations.md` do not need updating.
```

### 5b. Edit system-architecture.md §2

Current §2 (Hook Configuration) contains Claude Code-specific event names, JSON format, exit code behavior. Move those specifics to `system-tool-integration.md §Claude Code`.

Replace §2 body with an architectural description:

```
## 2. Hook Configuration

The framework uses lifecycle hooks to enforce consistency automatically. Hooks fire at key
session events and dispatch to the governance scripts in `lib/scripts/`. The dispatch
mechanism is tool-specific — see system-tool-integration.md for how each tool wires hooks.

The three canonical lifecycle events the framework requires:
- **Session open** — surface project state (session-start-report.sh)
- **After write/edit** — stale-ref check on wiki/plans, CONTENT_INDEX advisory (post-write-check.sh)
- **Session close** — four-script consistency chain (check-index → check-links → check-stale-refs → check-conclusions-alignment)

The hook dispatcher (bin/hook.sh) receives the event name and routes to the correct script.
Tool-specific configuration lives in system-tool-integration.md.
```

### 5c. Edit system-operations.md

Strip remaining Claude-specific language from the methodology:

- In §4 `.claude/` section: remove `settings.json` format details — replace with "hook configuration delegates to the tool integration layer (see `system-tool-integration.md`)"
- In §14 Trigger Events table footer: change "See `system-architecture.md §7`" to "See `system-verification.md §2`"
- Replace any reference to "slash command" with "the skill" — invocation syntax is tool-specific
- Remove any reference to `SessionStart`, `PostToolUse`, `Stop` as event names — replace with "session open", "after write", "session close"

### 5d. Update system-index.md

Add row to the system-* family table:

```
| [`system-tool-integration.md`](./system-tool-integration.md) | How each supported tool (Claude Code, Cursor, ...) consumes the framework — hook events, config format, limitations |
```

---

## Step 6 — Verification and version bump

**Stale ref check — legacy paths:**
```bash
grep -r "payload\|scripts/meta\|wiki/meta\|scripts/templates" . \
  --include="*.md" --include="*.mjs" --include="*.sh" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.git
```
Must return 0 results.

**Stale ref check — `output/` rename:**
```bash
grep -r "\boutput/" . \
  --include="*.md" --include="*.mjs" --include="*.sh" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.git
```
Must return 0 results.

**Directory rename check:**
```bash
ls examples/consumer/conclusions/ && ! ls examples/consumer/output/ 2>/dev/null
```
`conclusions/` must exist; `output/` must not.

**Template check:** `lib/templates/template-index.md` has `session.plan-template.md` row, and all destination folder entries say `conclusions/` (not `output/`). `lib/templates/session.plan-template.md` file exists. `lib/templates/signal.results-template.md` contains "Discovery type" (internal/external distinction added).

**System index check:** `lib/wiki/system-index.md` has `system-tool-integration.md` row, Three-Tier diagram reads `conclusions/` and `deliverables/`, and has a `## Conceptual Layers` section above the Activity Lifecycle table.

**Architecture check:** `lib/wiki/system-architecture.md` has a `§1.3` section (Knowledge Layer Model).

**Wiki layers check:** `lib/wiki/system-operations.md` has `wiki/client/`, `wiki/user/`, and `deliverables/` in §4, each with raw/ source notes. `lib/wiki/system-tool-integration.md` file exists.

**Init check:** `bin/commands/init.mjs` USER_DIRS includes `conclusions`, `deliverables`, `wiki/client`, `wiki/user`.

**Skill checks:**
- `lib/.claude/skills/signal/SKILL.md` exists
- `lib/.claude/skills/wiki-manage/SKILL.md` contains "promote" sub-command
- `lib/.claude/skills/activity-conclude/SKILL.md` contains "Signal check"
- `lib/.claude/skills/knowledge-audit/SKILL.md` Dimension 1 lists all four wiki layers; Dimension 14 has layer-specific rules for all four; Dimension 15 exists

**Librarian coverage check:** `lib/.claude/agents/librarian.md` Dimensions 1 and 8 list all four wiki layers.

**Rules and base check:**
- `lib/.claude/rules/behavioral.md` Rule 6 contains `wiki/client/` and `deliverables/`
- `lib/CLAUDE.base.md` folder map contains `deliverables/` and `wiki/client`

**Trigger events check:** `lib/wiki/system-operations.md` §14 has rows for: wiki/client/ updates, wiki/user/ updates, deliverables/ artifact creation.

**Bump:** `package.json` → `0.1.4`. Commit.

---

## File change summary

| File | Action |
|------|--------|
| All `lib/**` files with `output/` path references (38 files) | Rename `output/` → `conclusions/` throughout |
| `examples/consumer/output/` directory | Rename to `examples/consumer/conclusions/` |
| `lib/wiki/system-decisions.md` | Add ADR for `output/` rename; add ADR for verbose-header removal |
| All `lib/wiki/*.md` `**Last updated:**` | Strip to date only (coordinate with §2 edit in system-architecture.md) |
| `lib/wiki/system-architecture.md` | Add §1.3 (Knowledge Layer Model); strip tool details from §2; expand §8 |
| `lib/wiki/system-index.md` | Add Conceptual Layers table; add system-tool-integration.md row; update Three-Tier diagram (conclusions/, deliverables/); update Three-Tier note; update Activity Lifecycle table |
| `lib/wiki/system-operations.md` | Add client/user/deliverables §4 entries with raw/ source notes; add §14 trigger event rows; strip tool-specific language |
| `lib/wiki/system-tool-integration.md` | **Create (new)** |
| `lib/templates/session.plan-template.md` | **Create (new)** — header does NOT include `**Source plan:**` field |
| `lib/templates/template-index.md` | Add session.plan row; update signal row note; all destination folders → `conclusions/` |
| `lib/templates/signal.results-template.md` | Add internal/external distinction |
| `lib/.claude/skills/signal/SKILL.md` | **Create (new)** |
| `lib/.claude/skills/activity-new/SKILL.md` | Step 4: reference session.plan-template.md |
| `lib/.claude/skills/activity-conclude/SKILL.md` | Step 4: add signal prompt |
| `lib/.claude/skills/wiki-manage/SKILL.md` | Add promote sub-command |
| `lib/.claude/skills/knowledge-audit/SKILL.md` | Add Dimension 15; update Dimension 1 (all four wiki layers); update Dimension 14 (all four wiki layers with layer-specific rules) |
| `lib/.claude/rules/behavioral.md` | Rule 6: add client/user/deliverables to file routing |
| `lib/.claude/agents/librarian.md` | Add client/user/deliverables to knowledge base structure; update Dimension 1 (all four layers); update Dimension 8 (all four layers with layer-specific boundary rules) |
| `lib/CLAUDE.base.md` | Add wiki/client, wiki/user, deliverables to folder map; rename output/ → conclusions/ |
| `bin/commands/init.mjs` | USER_DIRS: conclusions, deliverables, wiki/client, wiki/user |
| `examples/consumer/wiki/client/README.md` | **Create (new)** |
| `examples/consumer/wiki/user/README.md` | **Create (new)** |
| `examples/consumer/deliverables/README.md` | **Create (new)** |
| `examples/consumer/CONTENT_INDEX.md` | Add client/user/deliverables section stubs |
| `package.json` | Version → 0.1.4 |
