# Framework Package Repo

This is the **package repo** — what gets published to npm. Not a consumer project.
See `docs/architecture.md §2` for the two-repo distinction.

---

## Layout

```
lib/                → Framework IP shipped inside the package
  CLAUDE.base.md    → Imported by consumer CLAUDE.md via @import
  .claude/          → agents/, skills/, rules/ — vendored into consumer on sync
  .cursor/          → rules/ — vendored into consumer on sync
  scripts/          → Hook scripts dispatched by bin/hook.sh
  templates/        → All templates (knowledge + script-generated)
  wiki/             → Methodology docs (system-*.md) referenced by AI layer

bin/                → CLI entry points (init, sync, doctor, hook dispatcher)
  commands/         → init.mjs, sync.mjs, doctor.mjs
  lib/              → CLI shared helpers (paths.mjs, sync-ops.mjs)
  hook.sh           → Hook dispatcher called by consumer settings.json
docs/               → Contributor-only docs (not shipped). architecture.md is the canonical design reference.
manifest.json       → Framework-owned paths: referenced | vendored | wiring
package.json        → bin, files, version, scope/name
```

## Key docs

- Design spec: `docs/architecture.md`
- What ships in the package: `manifest.json`
- Consumer reference: run `canon init` in a scratch dir — output verified by `test/integration/update-safety.sh` (ADR-016)
- Framework methodology: `lib/wiki/system-index.md`

## Working on this repo — read first, then change

The architecture knowledge lives in the repo, not in any session. Load the relevant layer **before** structural work:

- **Decisions (why)** → `lib/wiki/system-decisions.md` — ADR Index first (Scope · Status · Guard)
- **Cross-file facts (what)** → `lib/wiki/system-invariants.md` — read before touching any listed concept
- **Stack + lifecycle** → `lib/wiki/system-architecture.md` §7.1 (governance stack), §1.2 (session), §3 (scripts)
- **Testing layers** → `docs/architecture.md §12` — includes the "Adding a content check" checklist

When you change X, update Y — the enumerable parts are CI-enforced (R-014 doc-currency guards), the rest is on you:

| Change | Must update |
|--------|-------------|
| new / superseded ADR | ADR Index row + resolving guard (meta-guard enforces); supersede = back-search checklist |
| new or changed check | docs §12 checklist: roster wiring, fixture pair, both-direction tests, §1.2 + §3 + §9 |
| new script / skill / unit suite | name it in system-architecture / docs §12 (R-014 fails CI otherwise) |
| new template | `lib/templates/template-index.md` row |
| new cross-cutting value | `system-invariants.md` row + guard ("Adding a new invariant" checklist there) |
| retired value or claim | scanners denylist gravestone |
