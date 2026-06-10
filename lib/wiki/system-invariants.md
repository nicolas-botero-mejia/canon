# System Invariants — Concept Registry

**Last updated:** 2026-06-10

**Scope:** Every cross-cutting fact in the framework that appears in more than one representation.
Each row names the canonical value, every location that must agree, whether the duplication is
accidental (collapse to reference) or intentional (declared mirror), and the mechanical guard.

This registry is the authoritative answer to "where does changing X land?" — read it before
touching any concept listed here. It is the data source for `test/unit/invariants.test.mjs`
which asserts agreement across locations automatically.

This file is layer 2 of the four-layer governance stack (decisions → invariants → guards →
runtime) — diagram and layer map in `system-architecture.md §7.1`.

**Audience routing (ADR-022):** this registry is maintainer-layer — it governs canon's own
files and tests. During consumer-project knowledge work it is not part of the read path;
ignore it unless explicitly asked. Consumer-relevant contracts surface through the
methodology ADRs and the runtime checks themselves.

> Promoted and completed from `system-architecture.md §9 "Parsing Contracts"` — that section
> contains the template/parsing contract subset; this file is the full registry. The §9 column
> count (4) diverges from the poc-roadmap template (6) — that is the first confirmed invariant
> violation caught by this registry.

---

## How to read this table

| Column | Meaning |
|--------|---------|
| **Concept** | The cross-cutting fact — a name, count, path, vocabulary, or field |
| **Canonical value** | The one true value; all other locations must match this |
| **Canonical home** | The one file that owns the definition |
| **Must agree (locations)** | Every other file where this value appears or is restated |
| **Dup kind** | `accidental` = should collapse to a reference; `intentional` = must stay per-tool/per-layer but values must stay in sync |
| **Guard** | The automated check that enforces agreement |

---

## Registry

### R-001 — Synthesis folder name

| | |
|---|---|
| **Canonical value** | `conclusions/` |
| **Canonical home** | `system-decisions.md ADR-008` |
| **Must agree** | `lib/.claude/rules/behavioral.md` Rule 6; `lib/.cursor/rules/behavioral.mdc` Rule 6; `bin/commands/init.mjs` USER_DIRS; `lib/scripts/session-start-report.sh` (counts this folder); `lib/scripts/watch-project.sh` (watches this folder); `lib/CLAUDE.base.md` folder structure block; `lib/templates/init.content-index-template.md` (Project layer section); `system-architecture.md §1.2`; all skill SKILL.md files referencing routing |
| **Dup kind** | accidental — all should reference ADR-008; no per-tool variation needed |
| **Guard** | `invariants.test.mjs` R-001; grep for `output/` in non-archived source files |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-002 — Roadmap status vocabulary

| | |
|---|---|
| **Canonical value** | `🔜 Planned` \| `⏳ In Progress` \| `✅ Complete` \| `Deprecated` \| `~~In Progress~~ Deprecated` \| `Migrated → Phase NN` |
| **Canonical home** | `lib/templates/poc-roadmap-template.md §Status key` |
| **Must agree** | `lib/scripts/check-contracts.sh` status regex; `system-architecture.md §9` parsing contract; `lib/.claude/skills/phase-*/SKILL.md` files that reference status values; `lib/.claude/skills/activity-*/SKILL.md` files |
| **Dup kind** | accidental — check-contracts.sh regex must match the template exactly |
| **Guard** | `invariants.test.mjs` R-002; `check-contracts.sh` runtime enforcement |

---

### R-003 — POC roadmap table columns

| | |
|---|---|
| **Canonical value** | 6 columns: `POC #` \| `Name` \| `Status` \| `Prerequisite` \| `Sessions` \| `Decisions it closes` |
| **Canonical home** | `lib/templates/poc-roadmap-template.md` |
| **Must agree** | `system-architecture.md §9` (currently says 4 columns — **confirmed drift**); `bin/lib/mcp-reader.mjs readPocRoadmap()` (reads 4 columns — **confirmed data loss**); `lib/scripts/check-contracts.sh` column contract |
| **Dup kind** | accidental — §9 and mcp-reader both derived from the template and drifted |
| **Guard** | `invariants.test.mjs` R-003; mcp-reader column count assertion |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-004 — Alignment verification fields

| | |
|---|---|
| **Canonical value** | Body field: `**Alignment verified:**` (human-readable, required in conclusions files); YAML field: `alignment_verified` (machine-readable, required in conclusions frontmatter) |
| **Canonical home** | `system-template-standards.md §YAML frontmatter convention` |
| **Must agree** | `lib/templates/poc.conclusions-template.md`; `lib/templates/session.conclusions-template.md`; `lib/templates/research.conclusions-template.md`; `lib/.claude/skills/conclusions-review/SKILL.md`; `bin/lib/mcp-reader.mjs` (reads `alignment_verified`); `lib/.claude/agents/librarian.md` Dimension 10; `lib/.claude/skills/knowledge-audit/SKILL.md` Dimension 10; `system-architecture.md §9` |
| **Dup kind** | intentional — body field is human-readable, YAML is machine-readable; both must exist and agree in value |
| **Guard** | `invariants.test.mjs` R-004; `check-conclusions-alignment.sh` |

---

### R-005 — Audit dimension count

| | |
|---|---|
| **Canonical value** | 15 total audit dimensions; Librarian covers 8 core dimensions (a declared subset of the 15, not a separate count) |
| **Canonical home** | `lib/.claude/skills/knowledge-audit/SKILL.md` (15 dimensions, canonical); `lib/.claude/agents/librarian.md` declares its 8 as "Consistency Dimensions" |
| **Must agree** | `system-architecture.md` any reference to dimension count; `system-operations.md` any reference; `lib/.claude/agents/librarian.md` must explicitly cross-reference to knowledge-audit as the superset |
| **Dup kind** | intentional — 15 vs 8 is not drift IF librarian explicitly declares "8 of the 15 knowledge-audit dimensions"; it IS drift if the relationship is implicit or contradictory |
| **Guard** | `invariants.test.mjs` R-005; librarian.md must contain explicit cross-reference to knowledge-audit |
| **Known drift** | None — fixed 2026-06-08 (explicit cross-reference added to librarian.md) |

---

### R-006 — Behavioral rule count

| | |
|---|---|
| **Canonical value** | 19 rules (Rules 1–19; note: Rule 13 appears after Rule 14 in `behavioral.md` — sequence is intentional per rule ordering history) |
| **Canonical home** | `lib/.claude/rules/behavioral.md` |
| **Must agree** | `lib/.cursor/rules/behavioral.mdc` (intentional mirror — must have same rules, condensed format ok); `system-architecture.md §1.2` "19 rules loaded via CLAUDE.md"; any count reference in other wiki files |
| **Dup kind** | intentional mirror (`.md` ↔ `.mdc`) for rule content; accidental for any count references in docs |
| **Guard** | `invariants.test.mjs` R-006; mirror diff check in invariants test |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-007 — Canonical skill list

| | |
|---|---|
| **Canonical value** | 14 skills: `/phase-new`, `/phase-update`, `/phase-deprecate`, `/phase-reorder`, `/phase-conclude`, `/activity-new`, `/activity-update`, `/activity-deprecate`, `/activity-migrate`, `/activity-conclude`, `/wiki-manage`, `/conclusions-review`, `/knowledge-audit`, `/activity-new addendum` (sub-command of activity-new) |
| **Canonical home** | `lib/.claude/skills/` directory (source of truth by existence) |
| **Must agree** | `system-architecture.md §1.1` operations table; `system-operations.md` skill reference; `lib/.claude/rules/behavioral.md` Rule 14 skill table; `lib/.cursor/rules/behavioral.mdc` Rule 14; `manifest.json` vendored paths |
| **Dup kind** | accidental — all references should derive from the directory |
| **Guard** | `invariants.test.mjs` R-007; directory count assertion |

---

### R-008 — Addendum conclusions model

| | |
|---|---|
| **Canonical value** | Addendum conclusions appended as `## Addendum NN` sections into the **parent POC conclusions file** — no standalone addendum-conclusions files created (ADR-010) |
| **Canonical home** | `system-decisions.md ADR-010` |
| **Must agree** | `lib/.claude/skills/activity-conclude/SKILL.md` (addendum sub-command); `lib/.claude/skills/activity-new/SKILL.md` (addendum sub-command); `lib/.claude/agents/librarian.md` Dimension 10; `lib/.claude/skills/knowledge-audit/SKILL.md` Dimension 10; `lib/templates/addendum.conclusions-section-template.md` |
| **Dup kind** | accidental — all should reference ADR-010 |
| **Guard** | `invariants.test.mjs` R-008 |

---

### R-009 — Template self-documenting name comments

| | |
|---|---|
| **Canonical value** | Each template's internal "Creates:" or "File type:" comment must match the template-index suffix for that template exactly |
| **Canonical home** | `lib/templates/template-index.md` (suffix = source of truth) |
| **Must agree** | Internal comment in each template file |
| **Dup kind** | accidental — template files restate info from template-index |
| **Guard** | `invariants.test.mjs` R-009 |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-010 — Framework base-context file

| | |
|---|---|
| **Canonical value** | Canonical base = `lib/CLAUDE.base.md`; consumer entry point = `CLAUDE.md` (thin wrapper with `@import lib/CLAUDE.base.md`); future: `AGENTS.md` is the convergent standard read by Cursor/Copilot/Codex — plan to make it the canonical base, with `CLAUDE.md` as a thin wrapper |
| **Canonical home** | `lib/CLAUDE.base.md` |
| **Must agree** | `bin/commands/init.mjs` (writes CLAUDE.md); `manifest.json` wiring section; `system-tool-integration.md §base file`; `docs/architecture.md §4` |
| **Dup kind** | intentional — per-tool filename differences handled by format adapters |
| **Guard** | `invariants.test.mjs` R-010; init output check |
| **Note** | SKILL.md is the **Anthropic-originated open standard** (agentskills.io), confirmed for Claude Code, Cursor v2.4+, Copilot (CLI+cloud+VS Code), Codex, Gemini CLI, and 30+ other tools. `.claude/skills/` is read natively by Claude Code, Cursor (compat), and Copilot — no vendoring needed for these. `.agents/skills/` is the cross-tool convergent path (Codex, Gemini CLI primary). See `system-tool-integration.md §Standards Alignment Model`. |

---

### R-011 — Stop hook behavior (advisory vs blocking)

| | |
|---|---|
| **Canonical value** | Stop hook is **advisory only** — it cannot block session close; exit code is ignored by Claude Code for the Stop event |
| **Canonical home** | `system-tool-integration.md §Claude Code lifecycle events` (code behavior) + ADR-013 (decision record) |
| **Must agree** | `lib/scripts/check-contracts.sh` (should not use exit 2 expecting to block Stop); `system-tool-integration.md` Blocking? column for Stop event; `docs/architecture.md` any Stop hook description |
| **Dup kind** | accidental — two docs currently imply Stop blocks (incorrect) while code is advisory |
| **Guard** | `invariants.test.mjs` R-011; ADR-013 |
| **Known drift** | None — fixed 2026-06-08 (system-tool-integration.md + system-architecture.md updated to advisory-only per ADR-013) |

---

### R-012 — Wiki path after ADR-007 flattening

| | |
|---|---|
| **Canonical value** | Framework wiki files live at `wiki/` (no `meta/` subdirectory) — `wiki/meta/` was flattened per ADR-007 |
| **Canonical home** | `system-decisions.md ADR-007` |
| **Must agree** | `lib/.cursor/rules/behavioral.mdc` Rules 5, 9, 10, 15 (all reference `wiki/meta/` — **confirmed drift**); `lib/.claude/rules/behavioral.md` (correct: uses `wiki/`); any other path references |
| **Dup kind** | accidental — `.mdc` was not updated when ADR-007 landed |
| **Guard** | `invariants.test.mjs` R-012; grep `wiki/meta/` in non-archived files |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-013 — Phase synthesis filename

| | |
|---|---|
| **Canonical value** | `phase-NN-summary.md` (phase-level synthesis file; `phase-{{PHASE_NUMBER}}-summary.md` in templates) |
| **Canonical home** | `lib/.claude/skills/phase-conclude/SKILL.md` |
| **Must agree** | `phase-deprecate`, `phase-update`, `phase-reorder`, `activity-deprecate` SKILL.md files; `lib/scripts/phase-reorder.sh`; `lib/wiki/system-operations.md`; `lib/.claude/agents/pm.md`; `lib/templates/phase-index-template.md` |
| **Dup kind** | accidental — all derive from the phase-conclude synthesis step |
| **Guard** | `invariants.test.mjs` R-013; `scanners.test.mjs` forbidden-scan (dead names `synthesis-conclusions`, `phase-NN-conclusions.md`) |
| **Known drift** | None — fixed 2026-06-08 |

---

### R-014 — Architecture-doc enumerations (scripts · skills · unit suites)

| | |
|---|---|
| **Canonical value** | The filesystem itself: `lib/scripts/*.sh`, `lib/.claude/skills/*/`, `test/unit/*.test.mjs` — source of truth by existence |
| **Canonical home** | the directories (self-enumerating) |
| **Must agree** | `system-architecture.md` (§1.2 lifecycle boxes + skill roster, §3 Scripts Inventory); package `docs/architecture.md §12` testing map |
| **Dup kind** | intentional — the docs must restate the rosters for readers; names must match exactly |
| **Guard** | `invariants.test.mjs` R-014 doc-currency trio — a script/skill/suite that exists but is undocumented fails CI (Rule 10's mechanical half) |
| **Known drift** | 2026-06-10: docs §8/§12 named 4 of 11 unit suites — found by manual audit, fixed when this guard landed |

---

## Whole-repo scanners (completeness layer)

The registry above lists *known* concepts and their locations — but a registry can only
catch drift in locations someone remembered to list. `test/unit/scanners.test.mjs` adds the
complementary guarantee by scanning **every** source file, so coverage is complete by
construction rather than by memory.

- **Forbidden-value scan** (denylist): dead values (`synthesis-conclusions`, `phase-NN-conclusions.md`,
  `wiki/meta/`, the `dirname "$0")/../..` root pattern, `blocks on exit 2`) asserted to appear
  nowhere except an explicit allowlist — the registry row or ADR that legitimately *defines* them
  as forbidden. A new file reintroducing a dead value fails immediately; there is no location list
  to maintain.
- **Self-enumerating coverage**: globs `lib/.claude/skills/*/` and `lib/templates/*-template.md`
  and asserts each member satisfies its rule (skill `name` matches its directory; every template is
  registered in `template-index.md`). **Adding skill #15 or a new template is covered automatically**
  — there is nothing to add to the test.

This is the structural answer to two recurring questions: *"where does changing X land?"* (the
forbidden-value scan visits all files) and *"did I remember to test the new thing?"* (the
self-enumerating tests read the filesystem, so new instances are guarded by construction). Only a
genuinely new *shape* of fact needs a new scanner entry. The scanner layer caught three drifts the
location-listed registry missed (orphaned-hook root pattern ×2, addendum conclude-command ×2,
unregistered `phase-index-template.md`) — the evidence that completeness must come from scanning,
not enumeration.

---

## Declared intentional mirrors

These pairs intentionally duplicate content across tools. Agreement is required; byte-equality is not.

| Mirror family | Files | Format difference | Who enforces agreement |
|---|---|---|---|
| Behavioral rules | `behavioral.md` ↔ `behavioral.mdc` | `.mdc` has YAML frontmatter block | `invariants.test.mjs` rule presence check |
| Hook wiring | `.claude/settings.json` ↔ `.cursor/hooks.json` | Different JSON schemas | `init.mjs` + `sync-ops.mjs` (write both) |
| Vendored agent/skill trees | `.claude/agents/`, `.claude/skills/` ↔ per-tool equivalents | Placement only; content identical | `sync` command |
| Base-context file | `CLAUDE.md` ↔ future `AGENTS.md` per tool | Filename + thin wrapper differ | Tools registry (Phase 2E) |

---

## Accidental duplication (to collapse)

These restate a fact from the canonical home without adding tool-specific variation. Plan: reduce to a reference or a single source.

| Concept | Currently duplicated in | Target |
|---|---|---|
| Output folder = `conclusions/` | R-001 locations | All reference ADR-008; no per-location restatement |
| Audit count (15 / 8) | R-005 locations | librarian.md explicitly declares "8 of 15 knowledge-audit dimensions" |
| Rule count (19) | R-006 doc references | Remove count claims from docs; test asserts directory count |
| Skill list | R-007 locations | All reference the skills directory as source of truth |

---

## Adding a new invariant

When a cross-cutting fact is established (new folder, new status vocabulary, new field name):

1. Add a row here before creating the second location that uses it
2. Name the canonical home — the file that owns the definition
3. Declare dup kind (accidental vs intentional)
4. Add the guard assertion to `test/unit/invariants.test.mjs`
5. Update `**Last updated:**` above
