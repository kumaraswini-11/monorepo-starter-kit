# 0011. Project MCP servers (github, context7, shadcn, next-devtools, better-auth)

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

## Update — 2026-07-16: added `better-auth` (fifth server)

Once authentication became a core focus (see
[0016](0016-authentication-strategy.md)), we added a fifth server to `.mcp.json`:

| Server        | Transport   | Why                                                                                               |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `better-auth` | remote HTTP | First-party Better Auth docs / examples / setup MCP (`mcp.inkeep.com`, keyless) for our auth core |

It **overlaps `context7`**'s docs retrieval, but is the authoritative,
auth-specific source. Keyless remote HTTP, so the same no-secrets, trust-gated
posture above applies. Drop it if the redundancy isn't worth the extra tool
surface.

## Update — 2026-08-22: agent skills adopted via the skills CLI (refines the rejection above)

The original "rejected `npx skills add`" line was aimed at the **unvetted community
registries** (`skills.sh`, `skillsmp.com`, aggregating anyone's skills — see
[../bookmarks.md](../bookmarks.md)); that stance still holds for those. What we **do**
adopt is narrower and vetted: **reputable first-party and known-author skill sets**,
installed with the same CLI but pinned and hash-locked:

| Skill set                                              | Source (GitHub)                         | Why                                                                              |
| ------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------- |
| frontend-design                                        | `anthropics/skills`                     | First-party (Anthropic, Apache-2.0); distinctive, non-templated UI/visual design |
| shadcn, vercel-react                                   | `shadcn/ui`, `vercel-labs/agent-skills` | First-party for our UI + React 19 stack                                          |
| better-auth (\*-best-practices, create-auth, 2FA, org) | `better-auth/skills`                    | First-party for our auth core (ADR 0016)                                         |
| engineering / productivity                             | `mattpocock/skills`                     | Well-known author (Total TypeScript); design, ADR/domain, research, review, TDD  |

**Guardrails that make this acceptable despite the supply-chain caution:**

- **Vendored + committed**, never fetched at runtime — the skill bodies live in
  `.agents/skills/` and are reviewed in the PR diff like any other code.
- **Hash-pinned** in `skills-lock.json` (SHA-256 per skill); an upstream change can't
  alter a committed skill silently, and re-adds are diffable.
- **Dev tooling, not shipped product** — like devDependencies, they never enter the
  app bundle, so the UNLICENSED/proprietary constraint ([0001](0001-proprietary-license-unlicensed.md))
  isn't touched (their own upstream licenses still govern the vendored copies).
- **Inert until invoked** — a skill runs only when explicitly called. Notably,
  `setup-pre-commit` (Husky) and `git-guardrails` install side effects **only if run**;
  both stay unrun for now (pre-commit is deliberately deferred — see
  [../future-improvements.md](../future-improvements.md)). Several mattpocock skills are
  upstream **in-progress** (`implement-spec`, `loop-me`, `writing-*`, `setup-ts-deep-modules`,
  `claude-handoff`) — usable but treat as experimental.

This supersedes the blanket rejection: **community registries out; reputable,
hash-pinned, first-party/known-author skill sets in.**

### Vendored vs. local skills (matters for template reuse)

`.agents/skills/` holds **two kinds** of skill, and the distinction is deliberate:

- **Vendored** (e.g. `frontend-design`, mattpocock, better-auth) — fetched from an
  external repo, recorded in `skills-lock.json` with a hash. `skills-lock.json` is a
  **manifest of external sources to re-fetch**; `npx skills experimental_install`
  _restores_ these. Re-vendor with `skills add --copy` so they land as real committed
  files (not Windows-fragile symlinks) — this repo keeps them committed.
- **Local / authored** (e.g. `interface-guidelines`, created via `skills init`) — our
  own content, the file **is** the source of truth, committed to git, and deliberately
  **not** in `skills-lock.json` (there is nothing external to fetch). Each such skill
  says so at the top.

**Why a clone/template inherits everything:** both kinds are committed files, so a
clone already has them — nothing "installs" them. The CLI has **no prune step**: a
later `install`/`update`/`sync` only re-fetches the _vendored_ entries in the lock and
never deletes a local authored skill (removal is only the explicit `skills remove`). So
`interface-guidelines` survives every re-install untouched. Agents also only discover
skills under `.agents/skills/` (and `.claude/skills/`) — never `docs/` — so authored
skills live here, not as documentation elsewhere.

### Local authored skills (registry)

The **canonical list of skills we wrote ourselves** — hand-authored, committed, and
_not_ in `skills-lock.json`. Everything under `.agents/skills/` **not** listed here is
vendored (its origin is in `skills-lock.json`). **When you add a new manual skill,
add a row here** so it stays easy to tell ours from the vendored ones.

| Skill                  | Path                                   | Purpose                                                                                                                                              | Distilled from                                                                   |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `interface-guidelines` | `.agents/skills/interface-guidelines/` | Concrete, checkable UI rules (radius, motion, type, OKLCH tokens, a11y, copy); the implementation-rules layer beside the vendored `frontend-design`. | interfaces.dev cheat-sheet + ui-skills.com, adapted to our stack + ADR 0024/0026 |

**Conventions for a new manual skill:**

1. Scaffold with `npx skills init <name>` (creates `.agents/skills/<name>/SKILL.md`).
2. Start the file with the `> Local, hand-authored skill …` note so it's self-identifying.
3. A precise `description:` (that's what triggers auto-invocation) and, where relevant,
   cross-references to the ADRs it encodes.
4. Add a row above. Do **not** add it to `skills-lock.json`.
