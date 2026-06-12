---
type: discovery-backlog
description: ""
key_facts: []
questions: []
---
<!-- discovery-backlog-template.md
     Destination: plans/discovery-backlog.md
     One per project. Tracks signals and addendum triggers awaiting action.
     Status values: Plan created | In Progress | Complete | Deprecated — [reason] — YYYY-MM-DD
-->

# Discovery Backlog

**Last updated:** {{DATE}}

Tracks external discoveries (signals and addendum triggers) that need further investigation.
Internal low-priority deferred observations live in conclusions files — only external, actionable triggers go here.

---

## Active Items

| ID | Type | Slug | Assessment date | Status | Revisit condition |
|----|------|------|----------------|--------|------------------|
| 001 | signal | [slug] | YYYY-MM-DD | Plan created | [what would trigger action] |
| 002 | addendum | poc-01-addendum-01 | YYYY-MM-DD | In Progress | — |

## Closed Items

| ID | Type | Slug | Assessment date | Status | Outcome |
|----|------|------|----------------|--------|---------|
| — | — | — | — | — | — |

---

## Type key

| Type | Meaning |
|------|---------|
| `signal` | External discovery with no clear parent document — routes to `signal.results-template.md` |
| `addendum` | External discovery that extends a specific concluded POC — routes to `addendum.plan-template.md` |

## Status key

| Status | Meaning |
|--------|---------|
| `Plan created` | Backlog entry assessed; plan file created in `plans/` |
| `In Progress` | Results being gathered |
| `Complete` | Conclusions written for this trigger |
| `Deprecated — [reason] — YYYY-MM-DD` | Trigger expired or resolved by other means |
