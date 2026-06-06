# Prompting, AI Workflow & Declarative Thinking

**Last updated:** 2026-05-31
**Scope:** How to work effectively with Claude (and LLMs generally) on design, research, and strategy work. Based on Andrej Karpathy's observations from December 2025 + community research + applied to non-coding creative/analytical work.

> **Why this exists:** Karpathy's analysis was too valuable to leave in a chat transcript. This file captures it, extends it beyond coding, and gives us a working reference for how to structure prompts, avoid common failure patterns, and improve over time.

---

## Table of Contents

1. [The Karpathy Framework — Four Failure Patterns](#1-the-karpathy-framework--four-failure-patterns)
2. [The Four Behavioral Principles (His Fix)](#2-the-four-behavioral-principles-his-fix)
3. [The Core Shift: Declarative Over Imperative](#3-the-core-shift-declarative-over-imperative)
4. [Translating This to Design & Research Work](#4-translating-this-to-design--research-work)
5. [The LLM Wiki Pattern](#5-the-llm-wiki-pattern)
6. [How to Structure a Good Prompt](#6-how-to-structure-a-good-prompt)
7. [What Claude Will Do With This](#7-what-claude-will-do-with-this)
8. [His Warnings — Atrophy and Slopacolypse](#8-his-warnings--atrophy-and-slopacolypse)
9. [Tests Worth Running](#9-tests-worth-running)
10. [Sources](#10-sources)

---

## 1. The Karpathy Framework — Four Failure Patterns

Andrej Karpathy (co-founder of OpenAI, former Tesla AI) published observations in late 2025 after coding heavily with Claude and Codex for several weeks. He had shifted from 80% manual coding to 80% agent coding in just a few weeks — calling it "the biggest change to my basic coding workflow in ~2 decades."

What he noticed was that the failure modes had changed. They were no longer obvious (syntax errors, compilation failures). They had become subtle — the kind of mistakes a slightly sloppy, hasty junior developer makes. Specifically four recurring failure patterns:

### Pattern 1: Silent Assumptions
**What happens:** The model makes assumptions on the user's behalf and runs with them without checking or flagging them. It doesn't surface ambiguity. It doesn't ask clarifying questions. It doesn't present multiple interpretations.

**Why it's dangerous:** The output looks complete and confident. You don't realize an assumption was made until you're deep into reviewing the work.

**In design/research work:** Writing a wiki file that interprets "design trends" as visual trends only, when the user also meant UX patterns and component architecture. Running with "keep it brief" when the user wanted comprehensive. Making a recommendation without flagging the assumption that drove it.

### Pattern 2: Overcomplicated Output
**What happens:** The model implements 1,000 lines when 100 would do. It over-abstracts, builds speculative structure "just in case," and doesn't clean up after itself. When challenged ("couldn't you just do X instead?"), it immediately agrees and cuts everything down — meaning it knew the simpler path existed and didn't take it.

**Why it's dangerous:** Hidden complexity is a maintenance debt. It also makes the output harder to review, which means errors hide inside the bloat.

**In design/research work:** Writing a 10-section wiki file when 4 sections cover the ground. Restating the same point in multiple sections. Adding caveats and qualifications that add length without adding insight. Building an elaborate question framework when a simple priority-sorted list would work better.

### Pattern 3: Collateral Damage
**What happens:** When editing existing content, the model changes things it wasn't asked to change — restructuring paragraphs it doesn't understand, removing "dead" content that was actually intentional, reformatting sections that didn't need it.

**Why it's dangerous:** You think you're getting a targeted update. You're actually getting a partial rewrite. Hard to catch in review because the modified parts look fine in isolation.

**In design/research work:** Updating one section of a plan and accidentally changing the tone of three other sections. Adding a new wiki entry and quietly renaming tokens throughout the file. Editing a question list and removing questions that seemed redundant but had intentional scope.

### Pattern 4: No Success Criteria
**What happens:** The model executes the literal instruction without checking whether the output achieves the underlying goal. It doesn't loop back. It doesn't self-evaluate. It stops when it has technically "done the thing," not when it has solved the problem.

**Why it's dangerous:** The deliverable satisfies the request but misses the point. You get a wiki file that is comprehensive without being useful, a strategy document that is long without being actionable.

**In design/research work:** Writing research that answers questions no one asked. Producing a 10-session agenda when the client meeting is 1 hour. Building a component list based on general best practice instead of what the product walkthrough revealed.

---

## 2. The Four Behavioral Principles (His Fix)

A 65-line CLAUDE.md written by the community from Karpathy's observations reached 110,000 GitHub stars in three months. The four principles:

### Principle 1: Think Before Acting
Before generating output: state assumptions explicitly. Present multiple interpretations when the request is ambiguous. Ask questions when uncertain about the goal. Do not run with a single interpretation when multiple valid ones exist.

### Principle 2: Simplicity First
Produce the minimum output that solves the problem well. If 200 lines could be 50, write 50. No speculative content, no structure added "for later." If asked whether something could be simpler, the honest answer is almost always yes — so default to simpler.

### Principle 3: Surgical Changes
When editing existing work, touch only what was asked. Every changed line should trace directly to the request. Do not reformat, restructure, or expand sections unrelated to the update. Remove only what was created by the change — not pre-existing content that seems unnecessary.

### Principle 4: Goal-Driven Execution
> *"LLMs are exceptionally good at looping until they meet specific goals... Don't tell it what to do, give it success criteria and watch it go."*

When given success criteria instead of step-by-step instructions, the model can loop and self-correct rather than executing blindly. This is the highest-leverage change a user can make.

---

## 3. The Core Shift: Declarative Over Imperative

This is the single most impactful change to workflow. Research confirms it:
- **67% improvement in task success rate** with declarative approaches
- **43.5% reduction in interaction steps**
- 61%+ of successful tasks completed in a single exchange vs. multiple back-and-forths

### The Difference

**Imperative:** Tells Claude *what steps to take*.
> "Write a wiki file on design trends for our product."

**Declarative:** Defines *what done looks like*.
> "Write a wiki file complete enough that 6 months from now, without re-reading it, we could use it to make component prioritization decisions for the product's design system — covering every component type, all validation patterns, and every chart type relevant to dashboards."

Same subject. Completely different output quality. The first produces a reasonable-looking document. The second produces something that earns its place as a reference.

### Why Declarative Works

When the model has success criteria, it can:
- Self-evaluate against the goal ("would this actually help someone make component decisions?")
- Loop and add depth where the goal isn't yet met
- Reject its own first draft if it doesn't achieve the criteria
- Flag when a goal is unclear or contradictory

Without success criteria, it satisfies the literal request and stops.

---

## 4. Translating This to Design & Research Work

Karpathy wrote about code. The patterns translate directly to design, research, and strategy work — sometimes even more so, because the feedback loops are longer and the failures are harder to detect.

### Prompt Transformation Examples

| Task Type | Imperative Version | Declarative Version |
|-----------|-------------------|---------------------|
| **Wiki research** | "Research our component library and CSS framework integration" | "Research this until you can walk into a client tech session and field any integration question without saying 'I'd need to look into that' — cover gotchas, configuration, and known failure modes" |
| **Session guide** | "Write the agenda for the brand session" | "Write an agenda that a junior designer could run alone if needed — every time block has a clear purpose, outputs are specific, and silence from the client on any topic still produces a decision" |
| **Question list** | "Write questions for the kickoff" | "Write questions that, if answered, eliminate every phase-blocking gap in our engagement plan — nothing in the plan should remain [TBD] that is in our control to close" |
| **Plan update** | "Update the strategy file with the new information" | "Update the strategy file so that after reading it, a team member who missed the last week of work knows exactly what was decided, what changed, and what they need to do next" |
| **Design brief** | "Summarize the brand guidelines" | "Summarize the brand guidelines so that a developer writing CSS variables knows exactly which values to use for every surface, text, interactive, and feedback state — without needing to open the original file" |

### When NOT to Use Declarative Prompting

Not every interaction needs a success criteria statement. Declarative prompting matters most for:
- New documents being created from scratch
- Research tasks with open scope
- Strategy decisions with multiple valid approaches
- Complex updates that affect multiple parts of the system

**It doesn't matter for:**
- Corrections ("fix this typo")
- Simple lookups ("what does WCAG 2.5.8 say?")
- Targeted edits ("change the date in section 3")
- Clarifying questions

The rule of thumb: if the task involves judgment about what to include or how to structure something, success criteria are worth 30 seconds to write.

---

## 5. The LLM Wiki Pattern

Karpathy's gist describes a three-layer architecture for persistent knowledge:

```
Layer 1: Raw sources (immutable)
  ↓ ingested by LLM
Layer 2: Wiki core (LLM-maintained markdown)
  ↓ indexed and navigable
Layer 3: Schema (CLAUDE.md — behavioral config)
```

### Why This Is Different From RAG

Traditional retrieval (RAG) rediscovers knowledge from scratch on every query. The LLM Wiki maintains persistent, evolving artifacts — synthesis compounds over time. Each session starts from a richer base.

> *"Nothing is 'built up' in traditional RAG — knowledge rediscovered per query. Here, synthesis compounds through persistent, maintained artifacts."*

### The Two Navigation Files

**index.md** — Content-oriented catalog. Every page listed with one-line summary, key facts, and what questions it answers. Updated during each ingest operation.

**log.md** — Append-only chronological ledger. Tracks every ingest, update, and maintenance pass. Enables unix-compatible parsing. Pattern: `## [2026-05-25] update | filename | what changed`

### This Project's Implementation

We're running this pattern for a design/client engagement context:

| Karpathy's Pattern | Our Implementation |
|-------------------|-------------------|
| Raw sources | `raw/` + `conclusions/` folders |
| Wiki core | `wiki/` — LLM-maintained markdown |
| Schema | `CLAUDE.md` |
| index.md | `CONTENT_INDEX.md` (project root) |
| log.md | `log.md` (project root — append-only ledger) |

Both are active. `CONTENT_INDEX.md` is the authoritative index with one-line summaries of every file. `log.md` is the append-only ledger that records what changed, when, and why — maintained throughout the engagement.

### Suggested log.md Format

```markdown
# Project Log

## [2026-05-25] create | wiki/06-prompting-and-ai-workflow.md
Added prompting best practices wiki based on Karpathy analysis.
Source: chat transcript, X post, GitHub trending.

## [2026-05-25] restructure | wiki/ → plans/
Moved 04-project-strategy.md and 06-engagement-v2.md to /plans/.
Wiki now contains only stable reference docs.

## [2026-05-22] create | wiki/05-tech-stack.md
First complete tech stack reference with component library, CSS framework, and chart library evaluation.
```

---

## 6. How to Structure a Good Prompt

A practical template for high-stakes prompts (new documents, complex research, strategy decisions):

```
[Context: what already exists that's relevant]
[Goal: what done looks like — the success criteria]
[Constraints: what must not change, what's out of scope]
[Format: how the output should be structured, if it matters]
```

### Example Applied

**Context:** We have a wiki on design trends (01) and a tech stack reference (05). The engagement plan V2 is in plans/02.

**Goal:** Write a session guide for the brand alignment session that a designer could run alone — every time block produces a specific output, and no phase-blocking gap (dark mode, icon library, brand status) should remain unanswered at the end.

**Constraints:** Don't duplicate what's already in the engagement plan — link to it instead. Keep the guide to one page.

**Format:** Time-blocked agenda table + question list organized by phase-blocking priority + outputs checklist.

---

## 7. What Claude Will Do With This

Based on this file, the behavioral rule in CLAUDE.md is:

**When a request is for a new document, new research, or a complex new task (not a correction, lookup, or targeted edit):** Claude will check whether the prompt includes success criteria. If it's purely imperative ("write X", "research Y"), Claude will ask before starting:

> *"Before I start — what does done look like? What should this accomplish or enable? Even a sentence helps me aim."*

**When a prompt is genuinely clear and declarative:** Claude will confirm understanding ("I'll write this so that [restate the success criteria] — starting now") and proceed.

**When Claude notices it's about to make an assumption:** It will name it explicitly before running with it.

This is not meant to be bureaucratic. It's a 30-second check that changes the quality of the first pass significantly. The goal is fewer revision cycles, not more checkpoints.

---

## 8. His Warnings — Atrophy and Slopacolypse

### Atrophy
> *"I've already noticed that I am slowly starting to atrophy my ability to write code manually."*

Generation (writing) and discrimination (reading/reviewing) are different cognitive capabilities. You can review a document well even as your ability to write it from scratch weakens.

**The risk for design/strategy work:** Over-delegating the thinking, not just the typing. Using AI for research, structuring, and drafting is additive. Using AI to decide what to prioritize, what to recommend to a client, or what to ask in a discovery session — and rubber-stamping the output — is where atrophy begins.

The defense: treat every AI output as a first draft requiring genuine judgment to validate. Don't approve what you can't improve.

### Slopacolypse
> *"I am bracing for 2026 as the year of the slopacolypse across all of github, substack, arxiv, X/instagram."*

AI-generated content that looks comprehensive without being genuinely useful. The failure mode: long, well-structured documents that don't actually answer novel questions.

**The test for our wiki:** Can you use it to answer a client question you haven't seen before? If a client stakeholder asks something unexpected in session and the wiki gives you the answer, it's real. If it only recaps what you already knew, it's slop.

**The defense:** Declarative prompting, genuine synthesis over summarizing, and the willingness to say "this section isn't useful" and cut it.

---

## 9. Tests Worth Running

Karpathy's advice is to test ideas, not just read them. Three concrete tests:

### Test 1: Declarative Briefing
Write success criteria for the next three prompts before submitting them. Note whether the first-pass output is closer to what you wanted. Hypothesis: fewer revision requests.

### Test 2: The Assumption Surface
After the next complex output, ask Claude: "What assumptions did you make in producing this?" It will surface them. Evaluate whether those were the right assumptions. This is a fast way to find where the output diverged from your actual intent.

### Test 3: The Utility Question
After reading any new wiki page or plan section, ask: "What question could I answer with this that I couldn't answer before?" If the answer is "none really," the content needs rewriting or cutting. Do this once a month on the full wiki.

---

## 10. Sources

- [Andrej Karpathy — Original X Post](https://x.com/karpathy/status/2015883857489522876)
- [Karpathy's LLM Wiki Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Karpathy CLAUDE.md — 100K GitHub Stars](https://miraflow.ai/blog/karpathy-claude-md-100k-github-stars-ai-coding-2026)
- [multica-ai/andrej-karpathy-skills — GitHub](https://github.com/multica-ai/andrej-karpathy-skills)
- [What Is Karpathy's LLM Wiki — MindStudio](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code)
- [Writing a Good CLAUDE.md — HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [CLAUDE.md Best Practices — UX Planet](https://uxplanet.org/claude-md-best-practices-1ef4f861ce7c)
- [Claude Code Best Practices — Official Docs](https://code.claude.com/docs/en/best-practices)
- [From Imperative to Declarative LLM Interfaces — arXiv](https://arxiv.org/pdf/2510.04607)
- [Context Engineering in 2026 — The AI Corner](https://www.the-ai-corner.com/p/claude-best-practices-power-user-guide-2026)

---

## 11. Applied to This Project — Examples

The Karpathy principles aren't abstract on this engagement. Here's how they map to real workflows:

### Example 1: Session planning (declarative vs. imperative)

**Imperative (what we avoid):**
> "Write a session guide for Session 6."

**Declarative (what we use):**
> "Write a session plan for Session 6 (UI Audit). Done means: every session goal from the phase index is covered, open decisions from Sessions 1–5 that the audit could resolve are included as ★ questions, prior deferred observations from POC 01–02 that relate to component structure are listed as observation checklist items, and the output checklist maps to the findings files we'll need."

The declarative version tells Claude what "done" looks like. The result is a plan a team member could run without additional briefing.

### Example 2: Research briefs (assumptions surfaced)

Before running any research brief (e.g., a platform research brief), we:
1. State what we already know (so Claude doesn't re-derive it)
2. Name the specific gap (what question the research answers)
3. Name what it feeds (which session or decision consumes it)

Without step 3, research often produces comprehensive but unfocused output. With it, Claude can weight findings by relevance to the actual decision.

### Example 3: Wiki updates (surgical, not expansive)

When a POC closes a decision, the wiki update prompt specifies: *"Update `wiki/project/<pipeline-doc>.md §4` to replace the placeholder with the confirmed tool invocation. Change only that section — don't restructure, don't add new sections."* This is Rule 3 (surgical changes) applied explicitly. Without it, a wiki update can cascade into a restructure that requires re-reviewing content that was already correct.

### Example 4: POC synthesis (success criteria over steps)

POC conclusions aren't prompted as "summarize the findings." They're prompted with an explicit structure: Verdict (1–2 sentences), Evidence Summary (specific numbers and outputs per hypothesis), Deferred Observations (what was seen but doesn't fit a hypothesis), Decisions Closed (tracker-formatted). The structure is the success criterion — not "write good conclusions."
