# System Index — Framework Meta-Documentation

This file is the entry point for the framework's own documentation. Read it first when navigating the meta layer.

---

## The system-* family

| File | What it answers |
|------|-----------------|
| [`system-index.md`](./system-index.md) | This file — where to look for what |
| [`system-architecture.md`](./system-architecture.md) | How the knowledge system is structured (hooks, scripts, templates, dependencies) |
| [`system-decisions.md`](./system-decisions.md) | Why key design decisions were made (ADR log — newest first) |
| [`system-operations.md`](./system-operations.md) | How to maintain it (naming, CLAUDE.md, wiki, plans, findings, log) |
| [`system-principles.md`](./system-principles.md) | The prompting and thinking model behind the methodology |
| [`system-template-standards.md`](./system-template-standards.md) | Template philosophy, naming conventions, and how to add new templates |
| [`system-verification.md`](./system-verification.md) | How to verify the system is working (checks, tests, functional verification) |

---

## Activity Lifecycle

Every engagement activity follows a predictable file lifecycle. Use this table to know which template to reach for and which skill to invoke.

| Activity | Plan | Notes | Results | Conclusions | Conclude skill |
|----------|------|-------|---------|-------------|----------------|
| **session** | `session.plan` → `plans/` | `session.field-notes` → `findings/` (human) | `session.results` → `findings/` (AI) | `session.conclusions` → `output/` | `/activity-conclude session` |
| **poc** | `poc.plan` → `plans/` | `poc.notes` → `findings/` | `poc.results` → `findings/` | `poc.conclusions` → `output/` | `/activity-conclude poc` |
| **research** | `research.plan` → `plans/` | `research.notes` → `findings/` | `research.results` → `findings/` | `research.conclusions` → `output/` | `/activity-conclude research` |
| **addendum** | `addendum.plan` → `plans/` | `addendum.notes` → `findings/` | `addendum.results` → `findings/` | `addendum.conclusions` → `output/` | `/activity-conclude addendum` |
| **signal** | — | — | `signal.results` → `findings/` | — | (no conclude; routes to next activity) |
| **handoff** | — | — | `handoff.results` → `findings/` | — | (no conclude; contextual bridge) |

Full template details → [`template-index.md`](../templates/template-index.md)

---

## Three-Tier Capture Model

Raw capture flows through three tiers before becoming stable knowledge:

```
tmp/ (scratch)
  ↓  discard or promote
findings/*-notes.md   ← live capture during the activity (tier 1: informal, disposable)
  ↓  synthesize
findings/*-results.md ← structured analysis after the activity (tier 2: evidence record)
  ↓  conclude
output/*-conclusions.md ← decisions, verdicts, wiki triggers (tier 3: stable knowledge)
```

**When to use each tier:**
- **`tmp/`** — throwaway scratch (intermediate outputs, code snippets, URL dumps). Auto-cleaned.
- **`findings/*-notes.md`** — live capture during execution. Informal, non-synthesized. Exists only while the activity is in progress; may be discarded if the results file captures everything.
- **`findings/*-results.md`** — written after the activity closes. Structured, evidence-backed, template-driven. Permanent record.
- **`output/*-conclusions.md`** — synthesized decisions and verdicts. Triggers wiki updates. Has alignment-verified field. Stable.

Nothing skips a tier. Observations go into notes, not directly into results. Results become conclusions only via `/activity-conclude`.

---

## Meta-Doc Maintenance

`system-architecture.md` and `system-operations.md` are the system's source of truth. Update both whenever a structural change is made (new folder, naming convention, template type, rule). See behavioral Rule 10.

`system-decisions.md` records the rationale for architectural choices — consult it before questioning a design that looks unusual.

`system-template-standards.md` is the reference for adding new templates or understanding why the template system is structured the way it is.

`system-verification.md` documents how to confirm the system is working after changes.
