# Framework Transformation Plan

**Status:** Active roadmap — run this from a session rooted in *this* repo.
**Goal:** Take this repo from a clean, client-free knowledge-system snapshot to a **published, updatable framework** that any project can `init` into and `npm update` safely — plus migrate the existing engagement corpus onto it.
**Design reference:** [`docs/architecture.md`](./architecture.md) — the packaging/update model this plan executes. Read it first.

**Done looks like:**
- `npx @nicolas-botero-mejia/canon init` scaffolds a consumer project (choice of AI-tool layers).
- `npm update @nicolas-botero-mejia/canon && npx @nicolas-botero-mejia/canon sync` refreshes the core and **provably never writes a user file** (the §9 contract in architecture.md, enforced by a test).
- The meta-wiki IP (the `system-*` docs, lifecycle, notes model) ships *inside* the package, so it updates the same way.
- The existing corpus runs on the new structure via `migrate`.

**Legend — where each step runs:**
🟦 author-anywhere (Claude can write it from any session) · �probe spike (needs a live session in a throwaway consumer project) · 🟩 execute-here (run in this repo)

---

## Phase 0 — De-risk spikes  🟪

**Objective:** Lock the one open design decision (architecture.md §5: symlink vs thin-vendor) on evidence, not a guess.

**Spike kit — run in a throwaway dir:**
```bash
mkdir -p /tmp/fw-spike && cd /tmp/fw-spike
npm init -y >/dev/null
mkdir -p node_modules/@nicolas-botero-mejia/canon/.claude/skills/demo-skill
mkdir -p node_modules/@nicolas-botero-mejia/canon/scripts/meta
printf '# Framework base\nYou are operating under the framework.\n' > node_modules/@nicolas-botero-mejia/canon/CLAUDE.base.md
printf 'name: demo-skill\ndescription: spike probe skill\n' > node_modules/@nicolas-botero-mejia/canon/.claude/skills/demo-skill/SKILL.md
printf '#!/usr/bin/env bash\necho "dispatcher ran: $1"\n' > node_modules/@nicolas-botero-mejia/canon/scripts/meta/hook.sh
chmod +x node_modules/@nicolas-botero-mejia/canon/scripts/meta/hook.sh

# Wiring under test
printf '# My Project\n\nMy facts here.\n\n@node_modules/@nicolas-botero-mejia/canon/CLAUDE.base.md\n' > CLAUDE.md
mkdir -p .claude
ln -s ../node_modules/@nicolas-botero-mejia/canon/.claude/skills .claude/skills   # symlink variant
```

**Checks (open a Claude Code session in `/tmp/fw-spike`):**
- **Spike A — `@import`:** Does `CLAUDE.md`'s `@node_modules/...` line pull the framework base into context? (Ask the session something only the base would answer.)
- **Spike B — symlinked discovery:** Does `demo-skill` appear in available skills? → **decides §5.** If no, fall back to thin-vendor.
- **Spike C — dispatcher:** Can a `settings.json` hook run `bash node_modules/@nicolas-botero-mejia/canon/scripts/meta/hook.sh stop`? (Shell-testable from anywhere; confirm in-tool too.)

**Acceptance:** §5 decided (symlink ✅ or thin-vendor fallback). `@import` and dispatcher confirmed working.
**Decision gate:** symlink vs thin-vendor for discovered dirs.

> I can pre-run the filesystem/shell parts (symlink resolves, dispatcher executes, `@import` file present) from outside and hand you a ✓/✗ so only the in-tool checks remain.

---

## Phase 1 — Re-home payload into package layout  🟦🟩

**Objective:** Turn this consumer-shaped folder into a publishable package.

**Target layout:**
```
@nicolas-botero-mejia/canon/
├── package.json            # bin, files, version
├── bin/                    # init.mjs · sync.mjs · doctor.mjs · hook.sh dispatcher
├── manifest.json           # framework-owned paths: referenced | vendored (architecture.md §8)
├── payload/                # the shipped framework IP (today's wiki/meta, scripts/meta, templates, .claude defs, .cursor, CLAUDE.base.md)
├── examples/consumer/      # a reference consumer project (thin wiring + user scaffolds)
└── docs/                   # architecture.md, this plan
```

**Steps:**
1. Move current framework files (`wiki/meta/`, `scripts/meta/`, `.claude/{agents,skills,rules}`, `.cursor/`, templates) into `payload/`.
2. Extract the framework half of `CLAUDE.md` into `payload/CLAUDE.base.md`; the user-facing skeleton becomes an `init` template.
3. Add `package.json` (`bin`, `files`, scope/name TBD) + an empty `manifest.json`.
4. Keep the current empty user scaffolds as `examples/consumer/`.

**Acceptance:** `npm pack` produces a tarball containing only `payload/`, `bin/`, `manifest.json`, `docs/`.

---

## Phase 2 — Build the CLI: `init` / `sync` / `doctor`  🟦🟩

**Objective:** The lifecycle, implementing the update-safety contract.

**Steps:**
1. **`manifest.json`** — every framework path tagged `referenced` (lives in node_modules, never copied) or `vendored` (the discovered dirs, copied/symlinked per §5). The single source of truth for what `sync` may write.
2. **`init`** — interactive: pick AI-tool layers (Claude / Cursor / Copilot / Windsurf / Codex). Scaffolds user dirs, writes wiring (`CLAUDE.md` skeleton + `@import`, `settings.json` → dispatcher, discovered dirs), records `.framework-version`.
3. **`sync`** — re-applies wiring from the installed package version. Writes **only** manifest-`vendored` paths + wiring. Run after `npm update`.
4. **`doctor`** — validates: package present, `@import` intact, vendored/symlinked dirs match installed version, dispatcher resolves, `.framework-version` == `node_modules` version.

**Acceptance (the headline test — automate it):**
```
init a fresh consumer → write junk into plans/ findings/ CLAUDE.md body
→ bump payload version → npm update + sync
→ assert: user files byte-identical; framework dirs refreshed; doctor green
```
This *is* the architecture.md §9 contract, executable.

**Decision gate:** distribution confirmed as npm + sync (architecture.md §6 left this to recommend; default unless the spike surfaces a blocker).

---

## Phase 3 — Meta-wiki restructure (the content IP)  🟦

**Objective:** Build out the framework's actual thinking layer — the part that was genericized but not yet restructured. Ships inside `payload/`, so it rides the update mechanism.

**Steps (from the original extraction vision):**
1. `system-*` family: `prompting-workflow.md → system-principles.md`, `architecture.md → system-architecture.md`, `system-maintenance.md → system-operations.md`; add `system-verification.md`, `system-index.md`; `TEMPLATE_MAP.md → template-index.md`. Run the reference cascade (skills, agents, rules, indexes).
2. Full **activity lifecycle table** (session/poc/research/addendum/signal/handoff: plan · notes · results · conclusions · conclude sub-command).
3. **§10 "The Framework in Practice"** — the designer-facing, activity-by-activity patterns.
4. **Notes model:** add `poc.notes` / `research.notes` / `addendum.notes`; fix the `poc.results`/`notes` template split; the three-tier capture model (`tmp` scratch → `findings/*-notes` → `findings/*-results` → `output/conclusions`).

**Acceptance:** `grep "system-maintenance\|prompting-workflow\|TEMPLATE_MAP"` → 0 stale refs; every activity has a notes layer; link-check clean.

---

## Phase 4 — Migration: import the existing corpus  🟦🟩

**Objective:** Move the OneDrive Phase-1 engagement onto the new structure without redoing discovery.

**Steps:**
1. `migrate` command: copy project-layer dirs (`plans/ findings/ output/ raw/ wiki/project/ wiki/standards/`) from a source into a consumer project; merge `CONTENT_INDEX` user entries; fill `CLAUDE.md` facts; append `log.md`.
2. Dry-run against the OneDrive copy.

**Acceptance:** Phase-1 conclusions + decisions tracker intact; alignment dates preserved; `doctor` + check scripts green.

---

## Phase 5 — Publish & dogfood  🟦🟩

**Steps:** lock the **name** (`praxis` / `chronicle` / `crónica` / …), `package.json` publish config, README, semver policy. Then dogfood: stand up the real engagement as a consumer via `init` + `migrate`.

**Acceptance:** a second project can `init` from the published package and `npm update` to receive a core change.

---

## Cross-cutting

- **The update-safety contract is the backbone** — Phase 2's automated test is the definition of done for the whole effort. If it ever fails, stop.
- **Naming** blocks only `package.json` publish (Phase 5) — everything before can use a placeholder scope.
- **Rule 15** applies to every governance/script change (content + functional test).

## How to run this

Open a Claude session rooted in this repo and execute phase by phase. Phase 0 needs a separate throwaway consumer session (the spike kit above). I (or any session) can author Phases 1–4 artifacts directly; you verify acceptance here.
