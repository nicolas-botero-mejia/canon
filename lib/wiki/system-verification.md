# System Verification

**Last updated:** 2026-06-06

**Scope:** How to confirm the framework is healthy — after changes, after a sync, or when something behaves unexpectedly.

> For what the checks do and how they're wired → [`system-architecture.md §2–3`](./system-architecture.md)
> For when to run them → [`system-operations.md §14`](./system-operations.md)

---

## 1. Health Checks

Run all checks manually to confirm the system is healthy:

```bash
# Index check — CONTENT_INDEX entries match files on disk
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-index.sh && echo "✓ Index clean"

# Link check — internal markdown links resolve
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-links.sh && echo "✓ Links clean"

# Stale ref check — no references to renamed/deleted files
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-stale-refs.sh && echo "✓ No stale refs"

# Alignment check — all conclusions files have an Alignment verified date
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/check-conclusions-alignment.sh

# Start report — JSON project state (wiki/plans/findings/output counts)
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/session-start-report.sh

# Watcher — file change monitor (starts watching, or errors with install instructions)
bash node_modules/@nicolas-botero-mejia/canon/lib/scripts/watch-project.sh
```

All checks should exit 0. The alignment check warns on unverified conclusions files — run `/conclusions-review` on each flagged file before closing the session.

---

## 2. Content vs. Functional Verification (Rule 15)

When a skill, agent, or hook is added or modified, **two levels** of verification are required:

```
Content check   → Confirm the text of the change is correct. The right words are present,
                  structure matches the file's conventions, links resolve.
                  Caught by: check-links.sh, check-stale-refs.sh, manual inspection.

Functional test → Invoke the changed mechanism against a controlled case. Observe actual
                  output. A new dimension must fire on a known-bad file and stay silent on
                  a clean file. A new sub-command must produce the correct action and log
                  entry. A new hook must block on violation and pass on clean state.
                  Caught by: running the skill/hook/agent in the session before closing.
```

**What counts as a functional test, by mechanism type:**

| Mechanism | Test it by |
|-----------|-----------|
| New skill dimension | Run the skill on a file that should trigger it; confirm it fires. Run on a clean file; confirm no false positive. |
| New skill sub-command | Execute the sub-command on a real or controlled case; verify output and log entry. |
| New hook script | Introduce a controlled violation; trigger the hook; confirm it fires. Resolve the violation; confirm it passes. |
| New agent behavior | Ask the agent to perform the new behavior; verify it does so correctly without prompting. |

Never close a session that adds or modifies governance mechanisms without running both levels.

---

## 3. Framework Package Verification

After `canon sync` or `npm update + sync`, run:

```bash
canon doctor
```

This checks:
- Package installed at the expected version
- `.framework-version` matches installed version
- `@import` line present in `CLAUDE.md`
- All manifest-vendored dirs present
- Hook dispatcher resolves

If any check fails, `doctor` prints the failing assertion and exits non-zero.

| # | Check | What it verifies |
|---|-------|-----------------|
| 1 | Package installed | `PACKAGE_ROOT` exists |
| 2 | `.framework-version` matches | Recorded version = installed package version |
| 3 | `@import` in `CLAUDE.md` | Import line points into `node_modules/` |
| 4 | Vendored dirs present | All `manifest.json` `vendored` entries exist in consumer |
| 5 | Hook dispatcher resolves | `bin/hook.sh` exists in package root |
| 6 | MCP server resolves (if opted in) | If `settings.json` has `mcpServers.canon`, `bin/mcp-server.mjs` must exist |

---

## 4. Full Test Suite

```bash
# All tests in sequence
npm run test:all

# Individual suites
npm test                  # Unit tests (node --test) — init, sync, doctor
npm run test:integration  # Update-safety + v0.1.4 contract (pack → install → init → sync → doctor)
npm run test:hooks        # Hook dispatcher routing + script existence
```

Run `npm run test:all` before every publish and whenever `sync` logic, `manifest.json`, or any CLI command changes.

The integration test (`test/integration/update-safety.sh`) verifies the full §8 update-safety contract:
1. Packs and installs the package into a temp consumer
2. Initializes; verifies `wiki/client/`, `wiki/user/`, `deliverables/`, `/signal` skill, and template accessibility
3. Writes user content in all user-owned dirs; snapshots checksums
4. Bumps the package version, re-installs, syncs
5. Asserts all user files byte-identical; framework dirs refreshed; `canon doctor` green

If this test fails, stop — the update-safety contract is broken.
