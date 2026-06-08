import { existsSync } from 'fs'
import { join } from 'path'
import { writeClaudeMd, writeClaudeSettings, writeCursorHooks } from './sync-ops.mjs'

/**
 * Tools registry — one entry per AI tool layer supported by this framework.
 *
 * Adding a new tool = add one entry here.
 * init.mjs and sync.mjs iterate this list — no code changes elsewhere needed.
 *
 * Entry fields:
 *   id            string   — stable key used in layers map and layerList output
 *   label         string   — human-readable name shown in prompts and logs
 *   promptText    string   — interactive-mode question shown during `canon init`
 *   defaultEnabled boolean — pre-filled answer used when `--yes` flag is set
 *   isInstalled   function — (consumerRoot) => bool; true if this tool's wiring
 *                            already exists (used by sync to decide whether to
 *                            re-write wiring without re-prompting)
 *   writeWiring   function — (consumerRoot, pkgName) => void; writes all wiring
 *                            files for this tool (hooks, settings, etc.)
 *
 * Cross-tool paths (.agents/skills/ symlink, AGENTS.md base file) are written
 * unconditionally at init time — they are not gated on any single tool entry.
 * See sync-ops.mjs writeAgentsMd() / writeAgentsSymlink().
 *
 * Standards reference:
 *   Skills  → SKILL.md open standard (agentskills.io); .claude/skills/ is the
 *             cross-tool path read natively by Claude Code, Cursor, and all
 *             Copilot hosts. .agents/skills/ (symlink) covers Codex + Gemini CLI.
 *   Base    → AGENTS.md open standard (Linux Foundation); read natively by
 *             Cursor, Copilot, Codex, Gemini, Zed, and 60k+ repos.
 *   Hooks   → Per-tool format; see system-tool-integration.md for the matrix.
 */
export const TOOLS = [
  {
    id: 'claude',
    label: 'Claude Code',
    promptText: 'Enable Claude Code layer? [Y/n] ',
    defaultEnabled: true,
    isInstalled: (consumerRoot) =>
      existsSync(join(consumerRoot, '.claude', 'settings.json')),
    writeWiring(consumerRoot, pkgName) {
      writeClaudeMd(consumerRoot, pkgName)
      writeClaudeSettings(consumerRoot, pkgName)
    },
  },
  {
    id: 'cursor',
    label: 'Cursor',
    promptText: 'Enable Cursor layer? [y/N] ',
    defaultEnabled: false,
    isInstalled: (consumerRoot) =>
      existsSync(join(consumerRoot, '.cursor', 'hooks.json')),
    writeWiring(consumerRoot, pkgName) {
      writeCursorHooks(consumerRoot, pkgName)
    },
  },
]
