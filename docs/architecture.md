# Framework Packaging & Distribution Architecture

**Status:** Draft — design spec for how this framework ships, installs, and updates.
**Scope:** The *package* layer (how the framework is distributed and updated safely). This is distinct from `wiki/meta/architecture.md`, which documents the *knowledge system* itself.
**Decided so far:** npm + reference model (§6); discovered-dirs = thin-vendor (§5, Phase 0). Open decisions tracked in §10.

---

## 1. Core principle — the framework is a dependency, not a copy

A user's working repo contains **only their content plus thin references.** All framework IP lives in the installed package under `node_modules/`, immutable, refreshed via `npm update`. This is the single property that makes "update the core without touching the user's data" *structurally guaranteed* rather than carefully managed.

> The old model copied framework files into the repo root and tried to protect them with markers. This model never copies the mutable IP into the repo at all — so there is nothing of the user's to overwrite.

---

## 2. Two repos — don't conflate them

| Repo | What it is | Layout |
|------|-----------|--------|
| **Package repo** (this one) | What we author and publish to npm | `bin/` (CLI), framework payload, `package.json`, `docs/` |
| **Consumer project** | What `init` produces for a user | user content dirs + thin wiring + `node_modules/` |

> The current clean-slate folder is shaped like a *consumer's* framework-owned files. To become the package, the payload must be re-homed (see §10). The clean slate is the reference for *what gets shipped*, not the package itself.

---

## 3. Three buckets of ownership

There are no "mixed" files under this model — only three clean categories:

| Bucket | Lives in | Mutated by update? | Examples |
|--------|----------|--------------------|----------|
| **Framework** | `node_modules/` (the package) | Yes — that's the point | `wiki/meta/`, `scripts/meta/`, templates, agent/skill/rule definitions, hooks |
| **User** | the repo, never written by tooling | **Never** | `plans/`, `findings/`, `output/`, `raw/`, `wiki/project/`, `wiki/standards/`, `tmp/`, the body of `CLAUDE.md`, the user's `CONTENT_INDEX.md` entries |
| **Wiring** | the repo, thin & reference-only | Only by explicit `sync` | `CLAUDE.md` `@import` line, `settings.json` hook delegation, the discovered dirs (`.claude/skills` etc.), `.framework-version` |

The whole design problem reduces to: **keep the wiring bucket as small and as pure-framework as possible**, so `sync` only ever writes files with no user content in them.

---

## 4. How each consumer-side file is wired

| File / dir | Where the real content lives | Wiring in the repo | Owner | What `update` + `sync` does |
|------------|------------------------------|--------------------|-------|------------------------------|
| `CLAUDE.md` | user's facts in the repo; framework base in `node_modules` | one `@import node_modules/@scope/name/CLAUDE.base.md` line | **User** | nothing — the imported file changes, the user's file doesn't |
| `CONTENT_INDEX.md` | indexes user dirs only | n/a — framework wiki isn't in monitored dirs | **User** | nothing |
| `.claude/settings.json` | hook logic in `node_modules` | hooks call `bin/hook.sh <event>` dispatcher | Wiring | optional re-sync if the dispatcher contract changes |
| `.claude/skills`, `.claude/agents`, `.claude/rules` | the package | **symlink → node_modules** *or* **thin-vendor** (see §5) | Framework (discovered) | overwrite — safe, no user content |
| `.cursor/rules`, `.cursor/hooks` | the package | same as above | Framework (discovered) | overwrite — safe |
| `scripts/meta/` | `node_modules` | referenced by the hook dispatcher | Framework | not present in repo |
| `wiki/meta/`, templates | `node_modules` | referenced by skills + index links | Framework | not present in repo |
| `plans/ findings/ output/ raw/ wiki/project/ wiki/standards/ tmp/` | the repo | n/a | **User** | **never touched** |

The rule of thumb a human can verify at a glance: **anything pointing into `node_modules/` is framework; everything else in the repo is yours.**

---

## 5. Discovered dirs: symlink vs thin-vendor — **DECIDED: thin-vendor**

> **Decision (Phase 0, 2026-06-05):** thin-vendor. Evidence: the Phase 0 spike confirmed a symlinked `.claude/skills` *is* discovered on macOS, but symlink-as-shipped-artifact fails on the three axes that matter — containers (`COPY` drops symlink targets), Windows (privileged symlink creation), and git (symlink-in-git footguns), none of which the spike exercised. The prevailing ecosystem pattern for a host tool that scans fixed root paths and does not follow into `node_modules` (e.g. Husky) is to **materialize real files** via a `prepare`/`sync` step, not symlink. Thin-vendor's only cost — running `sync` after `npm update` — is one command, and overwrite is data-safe because the dirs are 100% framework. Symlink may be revisited as an opt-in optimization if cross-platform behavior is later validated.


Claude Code and Cursor discover skills/agents/rules/hooks by scanning fixed root paths; they do **not** follow into `node_modules`. So this small set of dirs cannot be pure-reference. Two options, both data-safe (the dirs are 100% framework):

| Option | Pro | Con |
|--------|-----|-----|
| **Symlink** `.claude/skills → ../node_modules/@scope/name/.claude/skills` | updates are instant; nothing to re-sync | fragile on Windows; symlink-in-git quirks; tools must follow symlinks |
| **Thin-vendor** (copy on `init`/`sync`, overwrite-on-update) | fully portable; explicit; git-clean | requires `sync` after `npm update` (one command) |

**Recommendation:** thin-vendor (portable, and overwrite is safe). Revisit symlink if a spike confirms clean cross-platform behavior. **Validate in spike:** does Claude Code discover a symlinked `.claude/skills`?

---

## 6. Distribution — npm package + sync CLI (recommended)

Why npm over the alternatives, given the "update the core later" requirement:

- **npm + sync (recommended):** consume as a dev dependency; `npm update` refreshes the immutable IP in `node_modules`; `sync` refreshes the thin wiring. Matches the user's "npm update" instinct; works even when the target repo isn't otherwise a JS project (the only cost is a `package.json` + `node_modules`).
- **Git template + degit:** great for one-shot scaffolding, **no update path** — disqualified by the core requirement.
- **Git subtree/submodule:** git-native updates, but framework files land in a subdir while tools expect `.claude/`, `CLAUDE.md` at root — awkward wiring.

---

## 7. CLI surface

| Command | Does |
|---------|------|
| `npx @scope/name init` | Interactive. Asks which AI-tool layers to enable (Claude / Cursor / Copilot / Windsurf / Codex). Scaffolds the user content dirs, writes the wiring (`CLAUDE.md` skeleton + `@import`, `settings.json` delegating to the dispatcher, discovered dirs), and records `.framework-version`. |
| `npx @scope/name sync` | Re-applies the wiring from the currently-installed package version. Writes only the wiring bucket; never the user bucket. Run after `npm update`. |
| `npx @scope/name doctor` | Validates integrity: package installed, `@import` line present, discovered dirs present and pointing at the right version, hook dispatcher resolves, `.framework-version` matches `node_modules`. This is the user's "guarantee the link is always there." |
| `npx @scope/name migrate` *(later)* | Imports existing project content (e.g. the CRC Phase-1 corpus) into a fresh consumer project. |

---

## 8. Versioning & manifest

- **`.framework-version`** in the consumer repo records the installed framework version (drives `doctor` and `sync`).
- The package ships **`manifest.json`** listing every framework-owned path and whether it is *referenced* or *vendored*. `sync` reads it to know exactly what it may write; `doctor` reads it to validate. Nothing outside the manifest's vendored set is ever written into the repo.

---

## 9. The update-safety contract (the guarantee)

> `npm update` + `npx @scope/name sync` will **only** write to the **wiring bucket** (discovered dirs + `settings.json` dispatcher + `.framework-version`). It will **never** write to `plans/`, `findings/`, `output/`, `raw/`, `wiki/project/`, `wiki/standards/`, `tmp/`, the body of `CLAUDE.md`, or the user's `CONTENT_INDEX.md` entries. `doctor` enforces and reports.

This is the headline promise; every design choice above exists to make it true by construction.

---

## 10. Open questions / next steps

**Spikes to de-risk the model — ✅ all complete (Phase 0, 2026-06-05):**
- ✅ `CLAUDE.md`'s `@import` resolves a path inside `node_modules` (SPIKE_A).
- ✅ Claude Code discovers a **symlinked** `.claude/skills` on macOS (SPIKE_B). §5 nonetheless decided **thin-vendor** on portability grounds — see §5.
- ✅ A hook `command` in `settings.json` points at a `node_modules` dispatcher and runs (SPIKE_C).

**Build order (proposed):**
1. Lock §5 (symlink vs vendor) via the spike.
2. Re-home the clean-slate payload into the package repo layout (§2) + `package.json` + `bin/`.
3. Implement `init` → `sync` → `doctor` against the manifest (§7–8).
4. Fold in the meta-wiki restructure (`system-*` family, lifecycle table, §10 "framework in practice", notes model) — it ships *inside* the package payload, so it benefits from the same update mechanism.
5. `migrate` for the existing corpus.

**Naming:** package scope/name still open (`praxis` / `chronicle` / `crónica` / …).
