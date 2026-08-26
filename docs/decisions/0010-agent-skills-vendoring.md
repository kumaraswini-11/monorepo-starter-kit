# 0010. Agent skills — vendored, hash-pinned, first-party/known-author

- **Status:** Accepted
- **Date:** 2026-08-22

## Context

[0009](0009-project-mcp-servers.md) originally **rejected** `npx skills add`. That
rejection was aimed at the **unvetted community registries** (`skills.sh`,
`skillsmp.com`, aggregating anyone's skills — see [../bookmarks.md](../bookmarks.md));
that stance still holds for those.

## Decision

What we **do** adopt is narrower and vetted: **reputable first-party, known-author,
and vetted domain-specialist skill sets** — the guardrails below (vendored +
committed, hash-pinned, inert until invoked) are what make a trusted third-party
source acceptable, not just first-party ones — installed with the same CLI but pinned
and hash-locked:

| Skill set                                                                           | Source (GitHub)                                | Why                                                                                                                      |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| frontend-design                                                                     | `anthropics/skills`                            | First-party (Anthropic, Apache-2.0); distinctive, non-templated UI/visual design                                         |
| `better-*` interface skills (a11y, colors, layout, typography, ui, writing, review) | `jakubkrehel/skills`                           | First-party interfaces.dev author; concrete, checkable UI-quality rules + a review workflow                              |
| shadcn, vercel-react                                                                | `shadcn/ui`, `vercel-labs/agent-skills`        | First-party for our UI + React 19 stack                                                                                  |
| better-auth (\*-best-practices, create-auth, 2FA, org)                              | `better-auth/skills`                           | First-party for our auth core (ADR 0011)                                                                                 |
| engineering / productivity                                                          | `mattpocock/skills`                            | Well-known author (Total TypeScript); design, ADR/domain, research, review, TDD                                          |
| playwright-best-practices                                                           | `currents-dev/playwright-best-practices-skill` | Vetted domain specialist (Currents, a Playwright-testing vendor); concrete e2e best-practices for the ADR 0025 e2e layer |
| monorepo-management                                                                 | `wshobson/agents`                              | Widely-used community agents collection; pnpm/Turborepo monorepo-workflow guidance for this repo's structure             |

**Guardrails that make this acceptable despite the supply-chain caution:**

- **Vendored + committed**, never fetched at runtime — the skill bodies live in
  `.agents/skills/` and are reviewed in the PR diff like any other code.
- **Hash-pinned** in `skills-lock.json` (SHA-256 per skill); an upstream change can't
  alter a committed skill silently, and re-adds are diffable.
- **Dev tooling, not shipped product** — like devDependencies, they never enter the
  app bundle, so the UNLICENSED/proprietary constraint
  ([0002](0002-proprietary-license-and-package-posture.md)) isn't touched (their own
  upstream licenses still govern the vendored copies).
- **Inert until invoked** — a skill runs only when explicitly called. Notably,
  `setup-pre-commit` (Husky) and `git-guardrails` install side effects **only if run**;
  both stay unrun for now (pre-commit is deliberately deferred — see
  [../future-improvements.md](../future-improvements.md)). Several mattpocock skills are
  upstream **in-progress** (`implement-spec`, `loop-me`, `writing-*`, `setup-ts-deep-modules`,
  `claude-handoff`) — usable but treat as experimental.

This supersedes [0009](0009-project-mcp-servers.md)'s blanket rejection: **community
registries out; reputable, hash-pinned, first-party/known-author skill sets in.**

### How skills travel with the repo (template reuse)

Every skill under `.agents/skills/` is a **committed file**, so a clone/template
already has it — nothing "installs" it. `skills-lock.json` is a **manifest of the
external source** each vendored skill came from; `npx skills experimental_install`
_restores_ those and `skills update` re-fetches them. The CLI has **no prune step** —
install/update/sync never delete a skill (removal is only the explicit `skills remove`).
Re-vendor with `skills add --copy` so skills stay real committed files, not
Windows-fragile symlinks. Agents discover skills only under `.agents/skills/` (and
`.claude/skills/`), never `docs/`.

All skills here are currently **vendored** (their origin is in `skills-lock.json`). If
we ever hand-author a local skill (via `skills init`), it simply won't have a lock entry
— call that out in the skill's own header so it's clear it isn't vendored.

## See also

- [0009](0009-project-mcp-servers.md) — project MCP servers, the sibling
  agent-config decision this was split from.
- [0007](0007-github-automation-governance-and-branch-protection.md) — the Dependabot
  release-cooldown / supply-chain posture this vendoring discipline parallels.
- [0002](0002-proprietary-license-and-package-posture.md) — the UNLICENSED/proprietary
  constraint, left untouched because vendored skills are dev tooling.
