# Skill & agent evals (ADR-020)

Behavioral evals for the skill/agent layer — the surface static checks can't
reach ("does the skill actually fire on the right trigger?"). Built on
[promptfoo](https://www.promptfoo.dev/docs/guides/test-agent-skills/) via
`npx` (no package dependency), using the `anthropic:claude-agent-sdk` provider
and the deterministic `skill-used` assertion.

## The three commands

| Command | Cost | What it does |
|---------|------|--------------|
| `npm run test:evals:selftest` | free | echo-provider run — proves the promptfoo runner + assertions work on this machine |
| `npm run test:evals` | **billed** (needs `ANTHROPIC_API_KEY`) | stages a real consumer via `canon init` in a scratch dir, runs the scenarios in `promptfooconfig.yaml` against the vendored skills |
| `npx promptfoo@latest view` | free | UI over the last results |

## Rules (ADR-020)

- **Never wired into push-CI** — an invariants test enforces that `ci.yml` and
  the `test`/`test:all` scripts never reference promptfoo. Run manually or as
  a scheduled job.
- **Deterministic assertions first** — `skill-used` / file-effect / grep
  assertions; LLM-graded rubrics only where determinism cannot reach.
- **Every eval failure becomes a pinned regression scenario** in
  `promptfooconfig.yaml`, the same way every check-script bug becomes a
  `test/fixtures/bad/*` tree.
- Nondeterminism sampling: add `--repeat 3` to the runner invocation when a
  scenario flakes.

## Output

`results/` is gitignored. The staged consumer is a `mktemp` dir, removed on
exit (`canon init` refuses to run inside the package repo — ADR-023 — which is
why the runner stages outside it).
