# Behavioral Rules

Rules governing how Claude should act in this project. Extracted from CLAUDE.md to keep project context lean and rules modular.

---

### 1. State Assumptions Before Acting
Before writing a wiki doc, research brief, or plan update: state what you're assuming, flag what's ambiguous, and ask when uncertain. Do not run with unverified assumptions.

### 2. Simplicity First
If something can be said clearly in 2 paragraphs, don't write 10. The index is the first place anyone reads — not buried in a long file. Avoid restating the same information across multiple files.

### 3. Surgical Updates
When updating a wiki file or plan: change only what needs changing. Don't restructure, reformat, or expand sections unrelated to the update.

### 4. Success Criteria Over Steps
When given a task, confirm the desired outcome before starting. If unclear, ask. When criteria are clear, loop against them — don't stop until they're met.

### 5. Prompt Validation
When a request is for a new document, new research, or a complex new task — and the prompt is purely imperative with no stated success criteria — ask before starting:

> *"Before I start — what does done look like for you? What should this accomplish or enable?"*

Do not ask this for corrections, lookups, targeted edits, or clarifying questions.

For background → `wiki/meta/system-principles.md`
For system maintenance rules → `wiki/meta/system-operations.md`

### 6. File Routing
Observations → `findings/`, synthesized conclusions → `output/`, plans → `plans/`, transient working files → `tmp/`. Use skills (`/activity-conclude session`, `/activity-conclude poc`) for routing. Do not synthesize directly into `plans/` or `wiki/`.

### 7. Wiki Context
Wiki updates use conclusions as the primary source and findings as supplementary context. If a finding isn't reflected in conclusions, surface it — don't drop it silently. Use `/wiki-manage` for all wiki lifecycle work (add / update / deprecate). The Librarian proposes changes; human approves before execution.

### 8. Prior Context Before New Work
Before creating a new session plan, POC, research plan, or addendum plan: load relevant prior conclusions (including the parent conclusions file for addendums), open decisions, and wiki state. Use `/activity-new session`, `/activity-new poc`, `/activity-new research`, or `/activity-new addendum` — they do this automatically.

### 9. Template Coverage
Every file type must have a template before more files of that type are created. Template names follow `[process-type].[file-type]-template.md`. See `wiki/meta/templates/template-index.md` for the full map and destination rules.

### 10. Meta-Doc Currency
`wiki/meta/system-architecture.md` and `wiki/meta/system-operations.md` are the system's source of truth — not regular wiki files. Any structural change (new folder, naming convention change, new template type, new process type, new behavioral rule) requires updating both before the session closes.

Updating means two things — both required:
1. **Add** the new content (new skill, new rule, new template section)
2. **Scan** for existing sections now made incomplete or inconsistent by the change — not just the obvious targets, but any section that describes the lifecycle, behavior, or structure you just changed

The Librarian flags this inline when structural work is done. The `/knowledge-audit` skill detects drift after the fact.

### 11. External Discovery Routing
When an external source (article, video, tool release, community post) extends an existing closed POC or research finding → it is an **addendum**. Create a plan using `addendum.plan-template.md`. Numbered per parent and sequential (addendum-01, -02, …). When there is no clear parent document → it is a **signal**. Create a results file using `signal.results-template.md`. Both route to `findings/` for results and `output/` for conclusions (addendum only). Add an entry to `plans/discovery-backlog.md`. Validate with human before any wiki updates.

### 12. Conclusions Alignment Check
Before creating any downstream plan (addendum, POC, or session) that depends on prior concluded work, check whether those conclusions carry an `**Alignment verified:**` date. If the field is absent or empty → run `/conclusions-review` on that file first (it will set the field after producing a patch list). If the field is set → proceed without re-running.

Do not start downstream work until the field is present or the patch list has been acknowledged.

Exception: if `/activity-conclude poc` was run in the same session and alignment was verified inline, `/conclusions-review` may be skipped — set the field manually with today's date.

### 14. Skill Namespace Disambiguation
Skills invoked in plans and templates come from three distinct sources. **Never infer or guess a namespace prefix.** If a skill isn't listed in the session's available-skills list, check the project's `.claude/skills/` directory before assuming anything else.

| Source | Location | Invocation form | Examples |
|--------|----------|-----------------|---------|
| **Project-local** | `[project-root]/.claude/skills/` | `/skill-name` (no prefix) | `/activity-conclude poc`, `/activity-conclude session`, `/wiki-manage`, `/activity-new poc`, `/activity-new session`, `/activity-new addendum`, `/conclusions-review`, `/knowledge-audit` |
| **User-level** | `~/.claude/skills/` | `/skill-name` (no prefix) | `/figma-analyze-component-set`, `/figma-audit-accessibility` |
| **Plugin/registered** | Registered provider | `namespace:skill-name` | `anthropic-skills:consolidate-memory`, `figma:figma-use` |

If a plan step says `/activity-conclude poc` and the skill doesn't appear in the available-skills list: check `[project-root]/.claude/skills/activity-conclude poc/` — it lives there. Do **not** add a namespace prefix and do **not** substitute an alternative. If the directory is missing, stop and ask (Rule 13).

### 13. Blocked Prerequisites — Ask, Don't Workaround
When a required tool, skill, or plugin is unavailable during plan execution, **stop and ask the user** before taking any alternative action. Do not attempt silent workarounds: running tools from temp files, reimplementing a skill inline, skipping the step, or substituting a different tool without explicit approval. State exactly what is missing, what step it blocks, and what would be needed to unblock it. Wait for user input before continuing.

This applies to: Figma plugin tools (figma-analyze-component-set, figma-audit-accessibility, etc.), CLI tools, MCP servers, and any skill invoked by a plan step.

### 15. Functional Verification for Governance Changes
When modifying a skill (`SKILL.md`), agent definition, behavioral rule (`.claude/rules/behavioral.md` or `.cursor/rules/behavioral.mdc`), or hook script, verification must include both:
- **Content check** — confirm the text of the change is correct (wording, structure, format)
- **Functional test** — invoke the changed mechanism against a known case (a file that should trigger the behavior, or one that shouldn't) and observe the actual output

Content checks alone are not sufficient for governance system changes. "The skill description mentions X" does not prove "the skill does X." The functional test proves the mechanism works, not just that it was described correctly.

**What counts as a functional test:**
- For a new skill dimension: run the skill against a file that should trigger the new dimension and confirm it fires; run against a clean file and confirm it doesn't false-positive
- For a new skill sub-command: execute the sub-command on a real or controlled case and verify the output (both the action taken and the log entry)
- For a new hook script: introduce a controlled violation, trigger the hook, confirm it fires; resolve the violation, confirm the hook passes
- For a new agent behavior: ask the agent to perform the new behavior and verify it does so correctly without prompting

Do not close a session that adds or modifies governance mechanisms without running both levels. See `wiki/meta/system-architecture.md §7`.
