# Content Index

See findings/phase-01-ghost-results.md and the [real results](./findings/phase-01-real-results.md) entry.

The line above is the trap: the ghost file's path appears only in prose, but the
line also carries an unrelated markdown link. The old line-based matcher (grep
RELPATH + grep `](`) counted that as registration of the ghost file — the
same-line false negative. Target-exact matching (ADR-019 stage 2) must flag the
ghost file as unlisted while leaving the genuinely linked sibling alone.
