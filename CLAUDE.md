# Framework Package Repo

This is the **package repo** — what gets published to npm. Not a consumer project.
See `docs/architecture.md §2` for the two-repo distinction.

---

## Layout

```
payload/            → Framework IP shipped inside the package
  CLAUDE.base.md    → Imported by consumer CLAUDE.md via @import
  .claude/          → agents/, skills/, rules/ — vendored into consumer on sync
  .cursor/          → rules/, hooks/ — vendored into consumer on sync
  scripts/meta/     → Hook scripts dispatched by consumer settings.json
  scripts/templates/→ File templates (phase index, etc.)
  wiki/meta/        → Methodology docs referenced by skills and indexes

bin/                → CLI entry points (init, sync, doctor, hook dispatcher)
examples/consumer/  → Reference consumer project — what `init` produces
docs/               → architecture.md, transformation-plan.md
manifest.json       → Framework-owned paths: referenced | vendored
package.json        → bin, files, version, scope/name
```

## Key docs

- Design spec: `docs/architecture.md`
- Roadmap: `docs/transformation-plan.md`
- What ships in the package: `manifest.json`
- Consumer reference: `examples/consumer/`
