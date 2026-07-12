# 0011. Project MCP servers (github, context7, shadcn, next-devtools)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

We want Claude Code (and teammates using other agents) to reach the external
systems this repo actually uses — configured as committed, team-shared "config as
code" rather than each person wiring their own. MCP (Model Context Protocol) is the
mechanism, and the project scope lives in a root `.mcp.json` that everyone shares.

Constraint: this is a private, compliance-bound product, so security and
supply-chain caution apply (see [0001](0001-proprietary-license-unlicensed.md)).

## Decision

Commit a root `.mcp.json` with four servers:

| Server          | Transport   | Why                                                                                                                            |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `github`        | remote HTTP | PRs, issues, code search on our repo                                                                                           |
| `context7`      | remote HTTP | Up-to-date, version-specific docs for our bleeding-edge stack (Next 16, React 19, Tailwind v4, Base UI) — beats raw web search |
| `shadcn`        | stdio (npx) | Browse + add components from registries; matches our shadcn-based `packages/ui`                                                |
| `next-devtools` | stdio (npx) | Official Vercel server; live Next.js build/runtime errors, routes, logs                                                        |

**Security posture:**

- **No secrets in the file.** GitHub auth comes from a `${GITHUB_PAT}` env var each
  dev sets themselves (minimal scopes); Context7 works keyless (optional
  `CONTEXT7_API_KEY` for higher limits). Project servers are trust-gated on first open.
- **Remote HTTP preferred** where available (github, context7) — cross-platform, no
  local process. The two stdio servers are inherently local tools.
- **Rejected for now:** the `skills.sh` registry / `npx skills add` (pulls unvetted
  third-party skills — supply-chain risk); Playwright and Sentry (deferred until
  testing / production land — see [../future-improvements.md](../future-improvements.md)).

## Consequences

- Every teammate gets the same tool access on clone, after the one-time trust prompt
  and setting `GITHUB_PAT`.
- The npx servers use `@latest` — acceptable for official dev tools (not product
  deps), but looser than our `minimumReleaseAge` discipline; can pin later.
- Windows: npx-based servers may need a `cmd /c` wrapper on older Claude Code
  versions; the committed file stays cross-platform, so that belongs in a local
  override, not here.
