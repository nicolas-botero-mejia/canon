# Content-script fixtures

Behavioral fixtures for the five `lib/scripts/check-*.sh` knowledge-base checks that
`canon doctor --deep` and the Stop hook run. Driven by
`test/unit/content-scripts.test.mjs`.

These exist because the scripts are production governance code that, until now, had
**zero behavioral tests** — `invariants.test.mjs` only asserts the scripts *contain*
certain strings, never that they *detect* a violation. Each fixture replays a real
failure class from the CRC→Canon migration.

## Layout

- `clean-populated/` — a minimal, contract-compliant phase-01 consumer tree. Every
  script must **pass** (exit 0) against it. This is the happy-path / no-false-positive
  baseline (behavioral Rule 15: fire on bad input *and* stay silent on good input).

- `bad/<violation-class>/` — minimal trees that isolate **one** violation so exactly
  one script trips. Each holds only the file(s) needed; other checks see "no files"
  and pass, so the failing script is unambiguous.

## Tier model

Three tiers, consistently implemented in both `runContentChecks()` (doctor.mjs) and
the Stop hook banner (bin/hook.sh). Both detect WARN by reading stdout for `⚠`.

| Tier | Example | Script exit | Caller behaviour |
|------|---------|-------------|-----------------|
| PASS | compliant | 0 | silent |
| WARN | Complete conclusion missing alignment **date**; index mtime stale | 0 (+ `⚠` in stdout) | surfaced as advisory in banner / doctor |
| FAIL | broken link, contract violation, unregistered file | 1 (contracts) / 2 (index, links) | surfaced as "requires attention" |

`bad/conclusions-empty-alignment/` documents the WARN tier: it **passes**
`check-contracts` (the field is present) yet **warns** in `check-conclusions-alignment`
(no date) — the gap that lets unverified stubs through `check-contracts` but not
through the alignment check.
