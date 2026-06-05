# Canon

**AI-assisted engagement framework.** A structured knowledge system for consulting and design engagements, distributed as an npm package so the methodology can be updated independently of the work.

---

## What it is

Canon gives every engagement a consistent shape: how sessions are planned, how findings are captured, how conclusions are synthesized, and how the AI layer (Claude Code, Cursor) is wired into that structure. The framework lives in `node_modules/` — your work lives in your repo. `npm update` refreshes the methodology; your content is never touched.

---

## Quick start

```bash
# In a new project directory:
npm install --save-dev @scope/canon
npx canon init
```

`init` asks which AI layers to enable (Claude Code / Cursor), then scaffolds:

```
plans/          findings/       output/         raw/
wiki/project/   wiki/standards/ scripts/project/
CLAUDE.md       CONTENT_INDEX.md  log.md
.claude/        .cursor/
.framework-version
```

---

## Staying up to date

```bash
npm update @scope/canon
npx canon sync
```

`sync` re-vendors the framework dirs (`.claude/skills`, `.claude/agents`, `.claude/rules`, `.cursor/rules`, `.cursor/hooks`) from the updated package. It **never** writes to `plans/`, `findings/`, `output/`, `raw/`, `CLAUDE.md` body, or any other file you own.

Verify at any time:

```bash
npx canon doctor
```

---

## Migrating an existing project

```bash
npx canon init                      # set up the consumer first
npx canon migrate --source /path/to/old-project --dry-run
npx canon migrate --source /path/to/old-project
```

`migrate` copies your project-layer dirs, merges `CONTENT_INDEX` user entries, fills `CLAUDE.md` facts, and appends `log.md` — leaving the framework layer untouched.

---

## The update-safety guarantee

> `npm update` + `npx canon sync` will **only** write to the wiring bucket (discovered dirs + settings dispatcher + `.framework-version`). It will **never** write to your content dirs or your `CLAUDE.md` body.

This is enforced structurally (the manifest lists every path sync may write) and tested automatically:

```bash
bash test/update-safety.sh
```

---

## Framework docs

After `init`, the framework methodology is available inside your `node_modules/`:

| Doc | Path |
|-----|------|
| System index | `node_modules/@scope/canon/payload/wiki/meta/system-index.md` |
| Knowledge architecture | `node_modules/@scope/canon/payload/wiki/meta/system-architecture.md` |
| Operations guide | `node_modules/@scope/canon/payload/wiki/meta/system-operations.md` |
| Prompting principles | `node_modules/@scope/canon/payload/wiki/meta/system-principles.md` |
| Verification guide | `node_modules/@scope/canon/payload/wiki/meta/system-verification.md` |
| Template index | `node_modules/@scope/canon/payload/wiki/meta/templates/template-index.md` |

These update with the package. Your AI session loads `CLAUDE.base.md` automatically via the `@import` line in your `CLAUDE.md`.

---

## Versioning policy

Canon follows **semver** with one opinionated rule about what counts as breaking:

| Change | Version bump |
|--------|-------------|
| New template, new wiki section, new skill, new script | `patch` |
| Renamed file, changed skill interface, new required wiring field | `minor` |
| Change that requires a manual migration step in consumer projects | `major` |

**The update-safety contract is the invariant** — if `sync` would ever write a user file, that is a bug regardless of version, not a breaking change.

`0.x` releases may make minor-level changes in patches while the framework stabilizes. Semver guarantees kick in at `1.0.0`.

---

## Naming the scope

The package name is `@scope/canon`. Before publishing, replace `@scope` with your npm org or username and run a global find-replace across the repo. The one-line change is in `bin/lib/paths.mjs`:

```js
export const PKG_NAME = '@yourscope/canon'
```

Then update `package.json` `name` field to match.

---

## Package structure

```
bin/                → CLI (canon init / sync / doctor / migrate)
payload/            → Framework IP shipped in the package
  CLAUDE.base.md    → @imported by consumer CLAUDE.md
  .claude/          → agents, skills, rules — vendored on sync
  .cursor/          → rules, hooks — vendored on sync
  scripts/meta/     → hook scripts dispatched by bin/hook.sh
  wiki/meta/        → methodology docs
  templates/        → activity file templates
manifest.json       → declares every path sync may write
examples/consumer/  → reference consumer project
docs/               → architecture.md, transformation-plan.md
```
