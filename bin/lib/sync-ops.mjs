import { cpSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'

/**
 * Vendor all manifest.vendored dirs from payload into the consumer project.
 * Each dir is overwritten entirely — safe because vendored dirs are 100% framework.
 */
export function vendorDirs(manifest, pkgRoot, consumerRoot) {
  for (const rel of manifest.vendored) {
    const src = join(pkgRoot, 'payload', rel)
    const dest = join(consumerRoot, rel)
    if (!existsSync(src)) continue
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(src, dest, { recursive: true, force: true })
  }
}

/**
 * Write the consumer CLAUDE.md skeleton with the @import line.
 * Only writes if CLAUDE.md is absent or contains the @import sentinel — never
 * overwrites a user-authored body.
 */
export function writeClaudeMd(consumerRoot, pkgName) {
  const path = join(consumerRoot, 'CLAUDE.md')
  if (existsSync(path)) return  // user owns this file after first init
  writeFileSync(path, [
    '# [Project Name] — Project Context',
    '',
    `@node_modules/${pkgName}/payload/CLAUDE.base.md`,
    '',
    '---',
    '',
    '## Confirmed Client Facts',
    '',
    '| Item | Confirmed Value |',
    '|------|----------------|',
    '| [fact] | [value] |',
    '',
    '---',
    '',
    '## Phase Sessions',
    '',
    '| # | Session | Date | Time | Type |',
    '|---|---------|------|------|------|',
    '| 1 | [name] | [date] | [time] | Client / Internal |',
    '',
  ].join('\n'))
}

/**
 * Write .claude/settings.json with hooks delegating to the package dispatcher.
 * Overwrites on sync — this is wiring, not user content.
 */
export function writeClaudeSettings(consumerRoot, pkgName) {
  const dir = join(consumerRoot, '.claude')
  mkdirSync(dir, { recursive: true })
  const dispatcher = `node_modules/${pkgName}/bin/hook.sh`
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({
    hooks: {
      SessionStart: [{ hooks: [
        {
          type: 'command',
          command: `date_str=$(date "+%A, %B %d, %Y %H:%M %Z") && echo "{\\"hookSpecificOutput\\": {\\"hookEventName\\": \\"SessionStart\\", \\"additionalContext\\": \\"Current date and time: $date_str\\"}}"`,
          statusMessage: 'Loading session date...',
        },
        {
          type: 'command',
          command: `bash ${dispatcher} SessionStart`,
          statusMessage: 'Loading project state...',
        },
      ]}],
      PostToolUse: [{ matcher: 'Write|Edit', hooks: [{
        type: 'command',
        command: `bash ${dispatcher} PostToolUse`,
        timeout: 30,
        statusMessage: 'Checking for stale references...',
      }]}],
      Stop: [{ hooks: [{
        type: 'command',
        command: `bash ${dispatcher} Stop`,
        statusMessage: 'Verifying knowledge base consistency...',
      }]}],
    },
  }, null, 2))
}

/**
 * Write .cursor/hooks.json delegating to the package dispatcher.
 * Overwrites on sync — wiring, not user content.
 */
export function writeCursorHooks(consumerRoot, pkgName) {
  const dir = join(consumerRoot, '.cursor')
  mkdirSync(dir, { recursive: true })
  const dispatcher = `node_modules/${pkgName}/bin/hook.sh`
  writeFileSync(join(dir, 'hooks.json'), JSON.stringify({
    version: 1,
    hooks: {
      sessionStart: [{ command: `bash ${dispatcher} SessionStart` }],
      postToolUse: [{ command: `bash ${dispatcher} PostToolUse`, matcher: 'Write|StrReplace' }],
      stop: [{ command: `bash ${dispatcher} Stop` }],
    },
  }, null, 2))
}
