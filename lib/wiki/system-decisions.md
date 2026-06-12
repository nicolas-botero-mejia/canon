# System Decisions

**Last updated:** 2026-06-12

Architectural and methodology decisions for the Canon framework.
Newest first. One entry per decision.

> For design questions — check here before opening an issue or redesigning something. These decisions have already been through the tradeoff analysis.

**Audience routing (ADR-022):** the Scope column separates two layers in one ledger. `methodology` and `tool:*` rows define contracts consumer projects rely on. `package-internal` rows govern the canon repo itself — during consumer-project work they are irrelevant unless explicitly asked about. The whole ledger ships because canon's runtime tooling cites ADR numbers in its output (ADR-010, ADR-012) and those citations must resolve in `node_modules`.

## Index

Every row binds a decision to its enforcement. **Guard contract (ADR-017):** the Guard cell of every `Accepted` ADR either names its mechanism with backticked tokens that literally appear in `test/` sources, or states `none — <why>`. A meta-guard test parses this table and fails CI when a heading lacks a row, a Scope is invalid, or a guard token doesn't resolve.

### Adding an ADR

1. Append the entry (newest-first) with Context / Decision / Rationale / Consequences.
2. Add its Index row — Scope, Status `Accepted`, and a Guard (backticked tokens that resolve in `test/`, or `none — <why>`).
3. Land the guard in the same change — the meta-guard fails CI if the named guard doesn't exist yet.

### Superseding an ADR

Flipping Status is the **last** step, not the whole move:

1. **Write the new ADR** — Context explains what failed or changed; Consequences enumerate the artifact disposal (the cleanup manifest).
2. **Back-search the old decision's artifacts** — grep the old ID and the old decision's values/paths across code, tests, configs, and docs:
   - Tests *named* for the old ADR → rename/re-point to the new one. Mechanically enforced: the ADR-017 meta-guard fails CI on any test named for a superseded ADR (comments may cite old IDs as history; test names may not).
   - Shipped citations → `lib/` and `bin/` may only cite **live** ADRs (script messages, comments, wiki, templates). Mechanically enforced: the meta-guard fails CI on any superseded-ADR citation outside this ledger — re-point each to the superseding ADR. Citations stay safe to write because IDs are immutable and a superseded entry here always carries its forward pointer.
   - Each guard gets an explicit fate: **transfer** (still protects the new world — re-label it under the new ADR), **gravestone** (denylist-style rules that must outlive the decision — keep), or **delete** (protected only the old world).
   - Config/doc remnants (ignore entries, allowlists, layout claims) → remove or correct.
3. **Flip the old ADR's Status** to `Superseded by ADR-NNN` and update its index row (Guard cell → `—`).

Worked examples: ADR-016 (Consequences as disposal manifest), ADR-018 (guard transfer, gravestone kept, remnant removed).

| ID | Title | Scope | Status | Guard |
|----|-------|-------|--------|-------|
| ADR-023 | init refuses to run inside the package repo; gitignore keeps only dogfood wiring | package-internal | Accepted | `ADR-023` init-guard tests (refusal + walk-up + no side effects + consumer pass) |
| ADR-022 | One scope-tagged ledger, shipped whole; audience boundary explicit | methodology | Accepted | `ADR-017` meta-guard Scope-enum check (tagging born-enforced) |
| ADR-021 | CONTENT_INDEX project layer projected from frontmatter | methodology | Accepted | `ADR-021` generator tests in `index-gen` suite (forms, markers, ADR-012 fallback, e2e contract) |
| ADR-020 | Skill and agent evals: promptfoo scenarios via npx, not push-CI | package-internal | Accepted | none — directional; the first eval-suite PR lands configs + runner |
| ADR-019 | Markdown validation moves to a Node core; bash stays dispatch | package-internal | Accepted | `md-rules` core; regressions per stage: `content-index-fenced-example`, `index-sameline-prose`, `links-target-forms` |
| ADR-018 | Cursor hooks delegate to the package dispatcher | tool:cursor | Accepted | `writeCursorHooks` dispatcher invariant (gravestone for the wrapper model) |
| ADR-017 | ADR index with machine-checked Guard contract | package-internal | Accepted | `ADR-017` meta-guard tests in invariants |
| ADR-016 | examples/ removed; init output is the reference | package-internal | Accepted | `ADR-016` invariants; `update-safety` step 2c |
| ADR-015 | Cursor hook architecture: vendored wrapper scripts | tool:cursor | Superseded by ADR-018 | — |
| ADR-014 | examples/consumer purpose: generated reference | package-internal | Superseded by ADR-016 | — |
| ADR-013 | Stop hook advisory only | tool:claude | Accepted | `ADR-013` invariants; scanners `R-011`; hook-dispatcher advisory tests |
| ADR-012 | No frontmatter on wiki/client + wiki/user | methodology | Accepted | `ADR-012` check-contracts behavioral test |
| ADR-011 | Test runner: node:test | package-internal | Accepted | `ADR-011` invariant (no runner dep; node --test) |
| ADR-010 | Addendum conclusions appended to parent | methodology | Accepted | `ADR-010` invariants; `check-addendum-integrity` behavioral tests |
| ADR-009 | Changelogs stripped from Last updated headers | methodology | Accepted | scanners `ADR-009` denylist rule |
| ADR-008 | output/ renamed to conclusions/ | methodology | Accepted | invariants `R-001` trio |
| ADR-007 | wiki/meta flattened in package | methodology | Accepted | `ADR-007` invariants; scanners `R-012` |
| ADR-006 | Templates consolidated to lib/templates/ | package-internal | Accepted | indirect — `template-index` naming tests resolve lib/templates paths |
| ADR-005 | migrate command removed from CLI | package-internal | Accepted | `ADR-005` invariant (no migrate in CLI) |
| ADR-004 | Update-safety contract | methodology | Accepted | `update-safety` integration suite (entire) |
| ADR-003 | lib/ as package IP container name | package-internal | Accepted | none — structural; every suite path resolves lib/ |
| ADR-002 | manifest.json single source for sync boundaries | methodology | Accepted | `manifest` checks in doctor + sync tests |
| ADR-001 | Thin-vendor over symlinks | methodology | Accepted | `update-safety` vendoring + user-file asserts |

---

## ADR-023 — init refuses to run inside the package repo; gitignore keeps only dogfood wiring

**Date:** 2026-06-11
**Status:** Accepted

**Context:** The package repo dogfoods its own consumer wiring — untracked vendored copies of `.claude/`, `.cursor/`, and `.agents/` run canon's hooks, rules, and skills on canon development itself. That layer was historically bootstrapped by running `canon init` at the repo root, and the accident cost was real: init scaffolds eleven user-content dirs that belong only in consumer projects, and its `writeGitignore` **appended to the tracked `.gitignore`** (the stray `# Canon` + `Thumbs.db` block was forensic evidence). The defense was ~16 gitignore entries silently swallowing consumer outputs — entries that read as "these folders belong here" and confused every later audit of the repo root.

**Decision:** `canon init` walks up from cwd; if any ancestor `package.json` is named `@nicolas-botero-mejia/canon`, it refuses (exit 1) with a pointer to scratch-dir testing and `canon sync`. With init impossible here, `.gitignore` keeps only the **sync/dogfood wiring** entries (`.claude/*`, `.cursor/*`, `.agents/`, `.framework-version`, `.canon-sync-manifest.json`); all init-only outputs (user dirs, `AGENTS.md`, `CONTENT_INDEX.md`, `log.md`) lose their entries. Fail loudly beats ignore silently.

**Rationale:** An ignore entry hides the accident; a guard prevents it — and the slimmed gitignore stops misdescribing the repo. The walk-up form also protects subdirectories: an init run inside `lib/` would have scaffolded user dirs into the shipped payload. Consumers are unaffected — the installed copy in `node_modules` is a descendant of the consumer root, never an ancestor, so the name match cannot fire in a real project.

**Consequences:** Dogfood-layer maintenance is sync-only: refresh with `canon sync` (recreate the untracked `.framework-version` marker first if absent); bootstrapping a fresh clone's dogfood layer means copying `.claude/` + `.cursor/` from an existing checkout or a scratch init's output. The guard and the gitignore slimming are one decision — reverting either alone reopens the hole. Guard: `ADR-023` init-guard tests in `init.test.mjs` (refusal, walk-up, untouched-repo asserts, consumer-name pass).

---

## ADR-022 — One scope-tagged ledger, shipped whole; the audience boundary is explicit

**Date:** 2026-06-10
**Status:** Accepted

**Context:** `lib/wiki/` ships whole, and the decision ledger + invariants registry mix audiences: as of 2026-06-10, 8 of 21 ADRs are `package-internal`, and most registry rows govern canon's own files and tests. A layering review asked whether maintainer content should be split out of the shipped payload. Three audiences were identified: (1) **consumer humans/agents** doing knowledge work — only `methodology`/`tool:*` rows define contracts they rely on; (2) **canon's own runtime tooling** — consumer-side scripts cite ADR numbers in their output (`check-addendum-integrity` → ADR-010, the frontmatter check → ADR-012), so citations must resolve inside `node_modules`; (3) **canon maintainers** — everything. Consumer exposure is already minimal: vendoring copies only the `.claude/`/`.cursor/` trees, and the seed CONTENT_INDEX deliberately points at principles/operations/template-index/architecture — not at this file or the registry.

**Decision:** One ledger and one registry, shipped whole. The separation is **logical** — the Scope column, audience-routing notes at the top of both files, and maintainer-layer annotations in `system-index.md` — never physical. No second ledger; no pack-time filtering.

**Rationale:** A split ledger is the dual-source failure mode ADR-016 was written to kill: two append-only logs sharing one ID sequence, supersedes that cross files, a meta-guard parsing both. Pack-time filtering requires a build step the repo deliberately lacks and makes the shipped file diverge from the repo file. The cost of shipping whole is inert kilobytes in `node_modules` — outside the consumer's repo, index, and default read path. Single scope-tagged logs are standard ADR practice for multi-audience repositories.

**Consequences:** Audience-routing notes at the top of this file and `system-invariants.md`. `system-index.md` lists both files with maintainer-layer annotations. `CLAUDE.base.md` and the init seed deliberately do **not** point at them — adding pointers would invite the reads the index-first pattern avoids. Guard: the Scope enum is enforced by the ADR-017 meta-guard. Future cross-audience tension is a design review, not an ad-hoc split.

---

## ADR-021 — CONTENT_INDEX project layer projected from frontmatter (target architecture)

**Date:** 2026-06-10
**Status:** Accepted

**Context:** `CONTENT_INDEX.md` is hand-maintained, and the ecosystem has converged on the opposite model: llms.txt-style indexes are *generated* — Fern, Mintlify, and GitBook project each page's `description` frontmatter into the index, support `noindex: true` opt-outs, and regenerate on every deploy. Our own drift history says the same thing: the examples-index rot (ADR-016) and the per-entry validation contract exist to police hand-editing mistakes a generator cannot make. Findings/conclusions templates already carry YAML frontmatter.

**Decision:** Target architecture: the **project layer** of `CONTENT_INDEX.md` is projected from per-file frontmatter (`description` + `questions` fields; `noindex: true` to exclude), generated by a canon command that shares ADR-019's validation core. The framework-layer seed stays static (ADR-016). The per-entry two-form contract becomes the generator's *output* contract. No migration starts before ADR-019's core exists; until the generator lands, the current hand-maintained contract remains fully enforced.

**Rationale:** A generated index cannot rot relative to its sources — registration checks reduce to "frontmatter present" at the file level, moving the advisory to the moment of writing. Hand-maintained indexes are now the anomaly in the conventions consumers' tools read.

**Consequences:** Templates gain `description`/`questions` frontmatter fields (system-template-standards update at implementation). The mtime-drift warning retires when generation lands (regenerate beats warn). The Index row's guard flips from directional to the generator's tests when that PR lands.

---

## ADR-020 — Skill and agent evals: promptfoo scenarios via npx, not push-CI

**Date:** 2026-06-10
**Status:** Accepted

**Context:** The skill/agent layer (14 skills, 3 agents) is validated only statically — structure, naming, string invariants. Behavioral questions ("does the Librarian actually flag meta-doc drift?") have no mechanical home; this is the largest untested surface left (G11's remainder). Industry practice is scenario evals: promptfoo provides a deterministic `skill-used` assertion (normalized from Claude's Skill tool calls), discovers skills from `.agents/skills/` — the symlink `canon init` already writes — supports JSON output for non-UI runs, and `--repeat` for sampling nondeterminism.

**Decision:** Evals live in `test/evals/` as promptfoo scenario configs, run via `npx promptfoo` (no new package dependency), exercising the real vendored skills through `.agents/skills/`. Deterministic assertions first (`skill-used`, required file edits, rubric greps); LLM-graded rubrics only where determinism cannot reach. **Not wired into push-CI** — run manually and as a scheduled job; every eval failure becomes a pinned regression scenario.

**Rationale:** Token cost and nondeterminism make push-CI gating wrong for LLM-in-the-loop tests; `npx` preserves the minimal-dependency posture; deterministic-first matches promptfoo's own CI guidance. First targets: Librarian consistency-dimension firing, `/conclusions-review` pass structure, `/activity-conclude addendum` append behavior.

**Consequences:** New suite root `test/evals/` (excluded from `npm test`). docs/architecture §12 gains the evals layer when it lands. Rule 15's "functional test for agent behavior" gains a mechanical home. The Index row's guard flips when the first harness PR lands.

---

## ADR-019 — Markdown validation moves to a Node core; bash stays dispatch

**Date:** 2026-06-10
**Status:** Accepted

**Context:** Three audit-confirmed parser bugs share one cause — bash/awk re-implements markdown lexing per script: the per-entry awk parser reads headings inside fenced code blocks (false positive), check-index's registration match is line-substring (same-line prose+link false negative), check-links flags directory targets. A fourth bug (BSD-first `stat` order silently killing the mtime branch on Linux) shows the shell-portability tax on top. Prior art: BMAD-METHOD validates its markdown layer with JS validators (regex + AST walkers) plus markdownlint; markdownlint's custom-rule API hands rules micromark tokens plus `lines`/`frontMatterLines`, making fence- and frontmatter-awareness free.

**Decision:** Markdown-structure validation moves to a Node validation core in `bin/lib/`, built on markdownlint's custom-rule API; the project contracts (index entry form, registration, link targets, header fields) become custom rules. The `check-*.sh` scripts become thin wrappers so hook/doctor wiring and output tiers are unchanged. `markdownlint` joins `@modelcontextprotocol/sdk` as a runtime dependency. Migration is incremental by bug class: (1) check-contracts CONTENT_INDEX per-entry block — kills the fence false positive; (2) check-index registration matching — kills the same-line false negative; (3) check-links target handling — directory links. awk/grep stays for non-markdown checks.

**Rationale:** The bug tail we keep paying (fences, frontmatter, inline code, platform quirks) is exactly what a maintained CommonMark parser eliminates. Rejected: stay-bash (third parser bug this month); zero-dep custom scanner (rebuilds micromark, poorly); full remark/unified pipeline (heavier than rule-running needs).

**Consequences:** New runtime dependency (markdownlint). Wrapper contract: exit codes and ✓/⚠/✗ tiers unchanged, so hook.sh, doctor, and the Stop banner are untouched. Each migration PR carries its fixture pair per docs/architecture §12 and flips this ADR's guard from directional to the named tests. ADR-011 stands — no *test-runner* dependency; node:test remains.

---

## ADR-018 — Cursor hooks delegate to the package dispatcher

**Date:** 2026-06-10
**Status:** Accepted — supersedes ADR-015

**Context:** ADR-015 chose vendored wrapper scripts in `.cursor/hooks/` on the premise that Cursor could not reference a dispatcher inside `node_modules`. The implementation went the other way and the premise proved wrong: `writeCursorHooks()` (`bin/lib/sync-ops.mjs`) writes `.cursor/hooks.json` whose commands run `bash node_modules/<pkg>/bin/hook.sh <Event>` directly — Cursor executes hooks.json commands from the project root, so a node_modules path works. `lib/.cursor/` never contained a `hooks/` directory, `manifest.json` never vendored one, and a unit invariant enforced the dispatcher form while ADR-015's text said the opposite. The decision was reversed in practice without a record — the exact failure mode ADR-017 now exists to catch.

**Decision:** Cursor hook wiring is a single `.cursor/hooks.json` written by init/sync (manifest `wiring` bucket), with every event delegating to the same `bin/hook.sh` dispatcher that Claude Code and Codex use. No vendored hook scripts; no `lib/.cursor/hooks/`.

**Rationale:** One dispatcher means one wiring surface across all tools — `.claude/settings.json`, `.cursor/hooks.json`, and `.codex/hooks.json` call the identical entry point, so hook behavior cannot fork per tool and a new check lands everywhere at once. No per-script vendoring to keep in sync. ADR-001's portability argument applies to content dirs; executable hook wiring is better referenced than copied.

**Consequences:** `.cursor/hooks.json` is overwritten on sync (wiring, not user content). The `writeCursorHooks` invariant — asserts dispatcher form, forbids `.cursor/hooks/` references — transfers to this ADR as its guard; it is a gravestone that deliberately survives the supersede. Remnant removed: the package `.gitignore`'s dead `/.cursor/hooks/` entry. ADR-015 marked superseded.

---

## ADR-017 — ADR index with Scope and machine-checked Guard contract

**Date:** 2026-06-09
**Status:** Accepted

**Context:** ADRs recorded decisions but enforced nothing — enforcement existed only where someone separately wrote a guard, and nothing bound the two. The 2026-06-09 audit measured the result: 6 of 14 active ADRs explicitly guarded, 4 unguarded, one (ADR-014) promising in its own Consequences a test that was never built, and one (ADR-015) whose text contradicts the implementation while the existing guard enforces the opposite. A decision record that names no enforcement becomes fiction at the first refactor.

**Decision:** `system-decisions.md` carries an Index table — `ID | Title | Scope | Status | Guard` — covering every ADR. Scope ∈ {methodology, package-internal, tool:claude, tool:cursor}. The Guard cell of every `Accepted` ADR either names its mechanism with backticked tokens that literally appear in `test/` sources, or explicitly states `none — <why>`. A meta-guard test parses the table and fails when an ADR heading lacks an index row, a Scope is invalid, or a guard token doesn't resolve in the test suite.

**Rationale:** The repo's measured pattern is "guards stop regressions, prose doesn't": ADR-013 (fully guarded) stopped regressing; ADR-014/015 (unguarded or diverged) rotted. Making the guard declaration mandatory and machine-checked moves "ADR promises a test" from a future audit finding to a CI failure. Scope tags separate consumer-facing methodology from package-internal engineering and mark tool-specific decisions explicitly.

**Consequences:** New ADRs must add an index row with a resolvable Guard (or explicit `none — <why>`) — the meta-guard fails otherwise. ADR IDs remain append-only chronological; the index is for navigation and contract, never renumbering. Superseded ADRs keep their rows with Status `Superseded by ADR-NNN`.

---

## ADR-016 — `examples/consumer/` removed; `canon init` output is the consumer reference

**Date:** 2026-06-09
**Status:** Accepted — supersedes ADR-014

**Context:** ADR-014 declared `examples/consumer/` a generated reference that must byte-match `canon init` output, verified by an init-diff test. The diff test was never built, and the folder accumulated hand-curated content init never produced (a 212-line CONTENT_INDEX vs init's bare stub) plus drift-class defects: 15 malformed links, a stale "sessions cannot close" blocking claim, and a skills list covering 7 of the 14 vendored skills. Its "default configuration (Claude Code + Cursor + MCP enabled)" also contradicted the tools-registry defaults (cursor and mcp default off). Comparable frameworks (e.g. BMAD-METHOD) keep no checked-in installer output — they test installation into temp fixtures.

**Decision:** Delete `examples/consumer/`. The reference for "what init produces" is running `canon init`, verified end-to-end by `test/integration/update-safety.sh` (pack → install → init → doctor → doctor --deep). The curated framework-layer index entries were salvaged into `lib/templates/init.content-index-template.md`, which `canon init` now writes as the consumer's starting `CONTENT_INDEX.md`.

**Rationale:** A checked-in copy of generated output is a drift surface even when verified — every init change demands regeneration churn; unverified, it rots (ADR-014's own prediction came true). No copy beats a verified copy: the e2e test exercises the real generator, and the salvaged seed turns decorative content into a shipped, single-sourced, governance-checked feature.

**Consequences:** No `examples/` directory. ADR-014's init-diff test obligation is void. `update-safety.sh` asserts init wiring (AGENTS.md, `.agents/skills` symlink, seeded index) and that a fresh consumer passes `doctor --deep`. Unit invariants pin the wiring sources (`writeCursorHooks` dispatcher form, init's seed write). Contributors inspect init output by running `canon init` in a scratch dir.

---

## ADR-015 — Cursor hook architecture: vendored dispatcher scripts

**Date:** 2026-06-08
**Status:** Superseded by ADR-018 (2026-06-10) — the wrapper-script model recorded here was never implemented; see ADR-018

**Context:** Three competing models existed in the codebase for how Cursor executes framework hooks: (1) vendored hook scripts in `.cursor/hooks/` called directly by `hooks.json`; (2) a single dispatcher script (like `bin/hook.sh` for Claude Code) that routes events; (3) lightweight wrapper scripts in `examples/consumer/` that delegate to node_modules. No single model was declared canonical, creating ambiguity about what to maintain.

**Decision:** Vendored hook scripts in `.cursor/hooks/` — identical model to Claude Code's `.claude/` directory pattern. `canon sync` vendors them from `lib/.cursor/hooks/`. The `hooks.json` wiring references these vendored scripts directly.

**Rationale:** Cursor does not support a package-scope dispatcher the way Claude Code does (where `bin/hook.sh` can be referenced from node_modules). Cursor hook scripts must be present in the consumer project root. The vendored model is already established by ADR-001 (thin-vendor over symlinks) — applying it to Cursor hooks is the natural extension. A dispatcher adds indirection with no benefit since Cursor's event model (PostToolUse, AfterAgent) maps directly to individual scripts.

**Consequences:** Cursor hook scripts live in `.cursor/hooks/` (vendored from `lib/.cursor/hooks/`). `canon sync` keeps them up to date. `hooks.json` wiring is written by `canon init`. No separate dispatcher file for Cursor. Examples/consumer/ should not contain standalone hook wrapper scripts.

---

## ADR-014 — `examples/consumer/` purpose: generated reference, not hand-maintained docs

**Date:** 2026-06-08
**Status:** Superseded by ADR-016 (2026-06-09)

**Context:** Two conflicting descriptions existed: `docs/architecture.md` described `examples/consumer/` as "documentation" showing the consumer project shape; the root `CLAUDE.md` described it as "what `canon init` produces." These are materially different: "documentation" implies it can be curated; "what init produces" implies it must be mechanically faithful to init output.

**Decision:** `examples/consumer/` is a **generated reference** — it must exactly match what `canon init` produces for a default configuration (Claude Code + Cursor + MCP enabled). It is not hand-maintained documentation.

**Rationale:** If `examples/consumer/` is documentation, it will drift from `init.mjs` output (and has already drifted). If it is the generated reference, it is verifiable by the test suite (run `canon init` into a temp dir, diff against `examples/consumer/`). The verifiable model eliminates an entire class of drift. New contributors using `examples/consumer/` as a reference must see what they will actually get.

**Consequences:** `examples/consumer/` is regenerated whenever `canon init` output changes — not hand-edited. The integration test suite must include an `init`-diff check against `examples/consumer/`. Curated additions (explanatory comments, extra files) are not permitted — they create drift. Design documentation lives in `docs/architecture.md`.

---

## ADR-013 — Stop hook: advisory only; exit 2 does not block session close

**Date:** 2026-06-08
**Status:** Accepted

**Context:** Claude Code's Stop event fires when a session ends. Documentation in `system-tool-integration.md` (the original version) stated "Yes — exit 2 blocks close" for the Stop event. The framework's check scripts (run in the Stop hook chain) used exit 2 to signal errors. A prior session deliberately changed the Stop hook chain to be advisory — using informational JSON output instead of exit 2 — to eliminate an infinite-close loop. But the documentation was not updated, and two files still implied Stop was blocking.

**Decision:** The Stop event is **advisory only**. Exit code from Stop hook scripts is ignored by Claude Code. Scripts in the Stop hook chain must not rely on exit 2 to prevent session close — it will not work.

**Rationale:** The advisory decision was made deliberately to eliminate the close-loop problem: a blocking Stop hook that errored would prevent the session from ever closing, requiring a force-quit. The correct pattern is: Stop hooks emit informational output (JSON advisory or plain stdout) that the model reads before the session terminates. The model can then decide to address issues in the same session or defer to the next. This is both safer and more aligned with Claude Code's actual behavior for the Stop event.

**Consequences:** All Stop hook scripts must treat errors as advisories — emit informational output, exit 0. The `system-tool-integration.md` lifecycle table for Claude Code is updated (Stop row: "No — advisory only"). `check-contracts.sh` and other Stop-chain scripts must not use exit 2 expecting to block. `system-invariants.md R-011` tracks agreement across all locations.

---

## ADR-012 — No frontmatter on `wiki/client/` and `wiki/user/` files

**Date:** 2026-06-08
**Status:** Accepted

**Context:** The framework exposes `wiki/client/` and `wiki/user/` files as full-content MCP resources. The MCP read-only layer (ADR-011 region) surfaces these files to the model as-is, without filtering or field extraction.

**Decision:** Files in `wiki/client/` and `wiki/user/` do not carry YAML frontmatter.

**Rationale:** Frontmatter is added to files where cross-file metadata queries need it — filtering by status, type, or date across many files. `wiki/client/` and `wiki/user/` are read as whole documents by the MCP layer; adding frontmatter would add noise without enabling any query that isn't already served by reading the file. Adding frontmatter for consistency would silently break the intended read model (full content, no header parsing). Rejected alternative: uniform frontmatter across all wiki files — consistent in appearance but adds no value for these two layers and couples them to a query model they don't use.

**Consequences:** Any wiki file placed in `wiki/client/` or `wiki/user/` must not include YAML frontmatter. If frontmatter-based queries are needed for these layers in the future, a separate design review is required before adding it.

---

## ADR-011 — Test runner: `node:test` over jest/vitest

**Date:** 2026-06-08
**Status:** Accepted

**Context:** The framework needed a test runner for its unit and integration test suite. Standard choices: jest, vitest, or the native `node:test` module (Node.js 18+).

**Decision:** `node:test` (Node.js built-in). No test runner dependency added to `package.json`.

**Rationale:** The framework was dependency-free at decision time (the MCP server later added `@modelcontextprotocol/sdk` as the sole runtime dependency) — adding jest or vitest would introduce a dev-dependency with its own transitive tree, configuration surface, and upgrade burden. `node:test` is native ESM, ships with Node.js 18+ (the project's minimum), and covers all needed assertions via `node:assert/strict`. The test suite is structural validation (file existence, keyword presence, script behavior) — not a complex test harness that needs jest's ecosystem (snapshots, mocking, parallel runners). Rejected: jest — large dependency, CommonJS-first by default; vitest — lighter but still a dependency with its own config layer.

**Consequences:** Tests run via `node --test test/unit/*.test.mjs`. No `jest.config.*` or `vitest.config.*` file. Contributors unfamiliar with `node:test` can reference the Node.js docs directly — no framework-specific test runner to learn.

---

## ADR-010 — Addendum conclusions appended to parent POC file

**Date:** 2026-06-06
**Status:** Accepted

**Context:** Addendum conclusions were written as standalone files (`addendum-NN-conclusions.md`). This created a fragmented hypothesis chain — the parent POC had H1–H7, addendum 1 had H8–H10 in a separate file, addendum 2 had H11–H13 in another. No single file showed the full arc of a POC investigation.

**Decision:** Addendum conclusions are appended as `## Addendum NN` sections directly into the parent POC conclusions file. No standalone addendum-conclusions files are created. H-numbers are sequential across parent and all addendums.

**Rationale:** A single conclusions file is the source of truth for an investigation. The sequential H-number chain is readable and verifiable in one place. Section-level `**Addendum alignment verified:**` dates handle the alignment tracking concern without requiring file proliferation.

**Consequences:** `activity-new addendum` no longer creates a conclusions stub. `activity-conclude addendum` appends to the parent file. `knowledge-audit` Dimension 10 checks sections, not files. Old standalone addendum-conclusions files (if any exist in consumer projects) are not auto-migrated — manual append to the parent conclusions file is needed. (Note: `/activity-migrate` is for moving planned activities between phases; it cannot restructure conclusions file content.)

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

**Decision:** `sync` is structurally prevented from writing any file not declared in `manifest.json`. Vendored dirs are framework-owned by definition (any user modification is a policy violation). The test in `test/integration/update-safety.sh` verifies this contract mechanically.

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

**Context:** Framework-owned dirs (`.claude/agents`, `.claude/skills`, `.claude/rules`, `.cursor/rules`; at decision time also `.cursor/hooks`, since dropped — `manifest.json` is the live list) need to be available in the consumer project root where Claude Code and Cursor look for them. Options: symlink from consumer root into `node_modules/`, or copy (thin-vendor) on init/sync.

**Decision:** Thin-vendor. Framework dirs are copied into the consumer on `canon init` and updated on `canon sync`.

**Rationale:** Web research confirmed the Husky pattern (v9) as the ecosystem standard for the same problem: host tool scans fixed root paths, doesn't follow node_modules. Symlinks fail on Windows, Docker mounts, and some CI environments. The copy cost is negligible (small markdown files, not large binaries). Portability wins. Evidence: Husky dropped its postinstall symlink model in v9 precisely because of cross-environment reliability.

**Consequences:** Consumer repo tracks vendored dirs in git. Syncing overwrites them (now with user-mod detection in v0.1.3). Framework IP is visible in the consumer without node_modules access.
