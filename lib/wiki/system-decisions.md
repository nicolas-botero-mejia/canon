# System Decisions

**Last updated:** 2026-06-06

Architectural and methodology decisions for the Canon framework.
Newest first. One entry per decision.

> For design questions — check here before opening an issue or redesigning something. These decisions have already been through the tradeoff analysis.

---

## ADR-009 — `**Last updated:**` verbose changelogs removed from wiki headers

**Date:** 2026-06-06
**Status:** Accepted

**Context:** Wiki file headers carried inline changelogs like `**Last updated:** 2026-06-06 (v0.1.3 restructure — ...)`. These changelogs duplicated information that belongs in `system-decisions.md` and burdened the header with history that decays quickly.

**Decision:** Strip changelogs from all `**Last updated:**` fields — date only.

**Rationale:** `system-decisions.md` is the canonical changelog. The date in the header is for meta-doc currency auditing (Dimension 2). The context belongs here, not in the header.

**Consequences:** All `lib/wiki/` file headers now carry only the date. Any changelog context was already in this file or in git history.

---

## ADR-008 — `output/` renamed to `conclusions/`

**Date:** 2026-06-06
**Status:** Accepted

**Context:** `output/` was the folder for synthesized activity conclusions and deliverables. The name was semantically empty — "output" could mean anything the system produces.

**Decision:** Rename `output/` → `conclusions/`. Add `deliverables/` as a new user-owned folder for client-facing formal artifacts.

**Rationale:** `conclusions/` is precise: it holds synthesized decisions and verdicts from activities. The rename also creates the explicit three-tier model: `findings/ → conclusions/ → deliverables/`. Before this rename, both team-internal synthesis and client-facing artifacts lived in `output/` — ambiguous about what was shareable. No consumers existed at rename time — the change was safe.

**Consequences:** 38 lib/ files updated. `examples/consumer/output/` renamed. `init.mjs` USER_DIRS updated. `deliverables/` added as a new scaffolded user dir.

---

## ADR-007 — `wiki/meta/` subdirectory kept in consumer; flattened in package

**Date:** 2026-06-06
**Status:** Accepted

**Context:** After renaming `payload/` → `lib/`, the package's `lib/wiki/` contained only `meta/` — no `project/` or `standards/` alongside it. The `meta/` level appeared redundant.

**Decision:** Flattened in the package (`lib/wiki/meta/` → `lib/wiki/`). In the consumer, `wiki/meta/` is not a folder — the framework wiki lives in `node_modules/`. Consumer `wiki/` contains only user-owned dirs (`project/`, `standards/`).

**Rationale:** At the package level, `meta/` was redundant — only one subdirectory existed. The naming is meaningful only in the consumer context where `wiki/` holds multiple layers (project + standards + the framework docs in node_modules). Since those docs don't actually land in the consumer's `wiki/meta/` folder (they stay in node_modules), the distinction is already virtual.

**Consequences:** All `wiki/meta/` path references in the codebase updated to `wiki/`. Consumer `CLAUDE.base.md` updated to clarify that framework methodology docs are accessed from node_modules.

---

## ADR-006 — Templates consolidated to `lib/templates/`

**Date:** 2026-06-06
**Status:** Accepted

**Context:** Templates were split across two locations: `lib/wiki/meta/templates/` (knowledge templates) and `lib/scripts/templates/` (script-generated templates). The location of knowledge templates inside a "documentation" folder (`wiki/`) was confusing since templates are action artifacts used by skills and scripts, not documentation.

**Decision:** Consolidate all templates into `lib/templates/` (top-level). The distinction between template categories (knowledge vs. script-generated) is documented in `template-index.md` and `system-template-standards.md`, not in directory structure.

**Rationale:** Templates aren't documentation. They're artifacts used by the skill and script layer to create new files. A single top-level `lib/templates/` location makes all templates discoverable in one place regardless of type. The category distinction is preserved in naming conventions and the template index.

**Consequences:** `template-index.md` and all skill SKILL.md files referencing template paths updated. `phase-index-template.md` moved from `scripts/templates/` to `lib/templates/`.

---

## ADR-005 — `migrate` command removed from CLI

**Date:** 2026-06-06
**Status:** Accepted

**Context:** `migrate` was built to import an existing engagement corpus into a newly initialized Canon consumer project. It served a one-time need during the initial rollout.

**Decision:** Remove `migrate` from the CLI. The command is no longer registered in `bin/cli.mjs`.

**Rationale:** A one-time tool should not become permanent CLI surface area. It would need indefinite maintenance, increase the perceived scope of the CLI, and confuse new users. If a future corpus import is needed, it can be scripted ad hoc.

**Consequences:** `bin/commands/migrate.mjs` deleted. README updated. Any future corpus imports require a standalone script.

---

## ADR-004 — Update-safety contract: sync never writes user files

**Date:** 2026-06-02
**Status:** Accepted

**Context:** Framework updates need to be safe to apply without human review of every file. Users must trust that `npm update` + `canon sync` will not destroy their work.

**Decision:** `sync` is structurally prevented from writing any file not declared in `manifest.json`. Vendored dirs are framework-owned by definition (any user modification is a policy violation). The test in `test/update-safety.sh` verifies this contract mechanically.

**Rationale:** Without this guarantee, users would be afraid to update the framework, defeating the purpose of the npm distribution model. The manifest makes the write boundary explicit and auditable.

**Consequences:** User files are safe across updates. If a user modifies a vendored file, `sync` now warns and skips (added in v0.1.3). `--force` overrides.

---

## ADR-003 — `lib/` as package IP container name

**Date:** 2026-06-06
**Status:** Accepted

**Context:** The package IP (CLAUDE.base.md, scripts, templates, wiki, agents, skills, rules) needed a home directory inside the npm package. Options: `payload/`, `lib/`, `src/`, `data/`, `content/`, `core/`.

**Decision:** `lib/`. (Renamed from `payload/` in v0.1.3.)

**Rationale:** `lib/` is the standard npm convention for a package's primary content. `payload/` was accurate but opaque to contributors unfamiliar with the codebase. `src/` implies a build step (there is none — ESM native). `data/` undersells it. `content/` is close but not conventional. `lib/` is the path of least resistance for new contributors.

`bin/lib/` (CLI shared helpers) is nested inside `bin/` — no naming conflict at the package root level.

**Consequences:** All internal path references updated. Consumer CLAUDE.md `@import` line updated from `payload/CLAUDE.base.md` to `lib/CLAUDE.base.md`.

---

## ADR-002 — `manifest.json` as single source of truth for sync boundaries

**Date:** 2026-06-02
**Status:** Accepted

**Context:** The CLI needed to know which paths it was allowed to write during `sync`. Without a single declaration, sync behavior would be scattered across command files and easy to diverge.

**Decision:** `manifest.json` at the package root declares three buckets: `referenced` (stay in node_modules), `vendored` (copied into consumer on sync), `wiring` (written by init/sync as infrastructure glue).

**Rationale:** Explicit over implicit. The manifest is human-readable, version-controlled, and checked by `doctor`. It also serves as documentation for users who want to understand what the framework touches.

**Consequences:** Any new path that sync should write must be declared in `manifest.json` first. The doctor command validates against it.

---

## ADR-001 — Thin-vendor over symlinks

**Date:** 2026-05-28
**Status:** Accepted

**Context:** Framework-owned dirs (`.claude/agents`, `.claude/skills`, `.claude/rules`, `.cursor/rules`, `.cursor/hooks`) need to be available in the consumer project root where Claude Code and Cursor look for them. Options: symlink from consumer root into `node_modules/`, or copy (thin-vendor) on init/sync.

**Decision:** Thin-vendor. Framework dirs are copied into the consumer on `canon init` and updated on `canon sync`.

**Rationale:** Web research confirmed the Husky pattern (v9) as the ecosystem standard for the same problem: host tool scans fixed root paths, doesn't follow node_modules. Symlinks fail on Windows, Docker mounts, and some CI environments. The copy cost is negligible (small markdown files, not large binaries). Portability wins. Evidence: Husky dropped its postinstall symlink model in v9 precisely because of cross-environment reliability.

**Consequences:** Consumer repo tracks vendored dirs in git. Syncing overwrites them (now with user-mod detection in v0.1.3). Framework IP is visible in the consumer without node_modules access.
