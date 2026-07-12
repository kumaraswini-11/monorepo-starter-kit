# 0012. AGENTS.md is the single source of truth; CLAUDE.md imports it

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The template shipped a root `AGENTS.md` (a Next.js "read the docs first" block).
`AGENTS.md` is the cross-tool standard read natively by Codex, Cursor, Copilot,
Gemini CLI, Windsurf, Aider, and others. **Claude Code reads `CLAUDE.md`, not
`AGENTS.md`.** We briefly had both files with different content — Claude missed the
Next.js warning, and other tools missed our project rules. We want one source of
truth, no duplication.

## Decision

Make **`AGENTS.md` the canonical instructions file** (Next.js managed block + all
project rules) and reduce **`CLAUDE.md` to a thin shim** whose body is a single
`@AGENTS.md` import.

This is the pattern the [official Claude Code memory docs](https://code.claude.com/docs/en/memory)
explicitly recommend — "create a `CLAUDE.md` that imports it so both tools read the
same instructions without duplicating them."

**Why not a symlink** (`CLAUDE.md` → `AGENTS.md`): on Windows it needs Admin /
Developer Mode and is fragile in git — the docs say to use the `@import` instead.
We develop on Windows, so the import is the only portable choice.

## Consequences

- One copy of the rules; every agent (Claude Code via the shim, all others
  natively) reads the same file — no drift.
- First open triggers a one-time `@import` approval dialog in Claude Code.
- Future monorepo scaling: Claude auto-loads nested `CLAUDE.md` (not nested
  `AGENTS.md`); path-scoped rules go in `.claude/rules/`. Deferred — see
  [../future-improvements.md](../future-improvements.md).
