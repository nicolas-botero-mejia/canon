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
