# Bookmarks

A personal, versioned stash of links worth keeping — articles, videos, repos,
docs, talks; anything useful to revisit. Each entry carries a one-line note on
_what it is_ (and, when useful, _why it's here_), so future-me remembers the
point — a bare URL is as forgettable as a browser bookmark.

_Newest first within each section. Run `pnpm format` to keep it tidy._

## AI & agent engineering

- [AI Hero](https://www.aihero.dev/) — Matt Pocock's (Total TypeScript, ex-Vercel)
  AI-engineering education: designing codebases so agents perform well, MCP tutorials.
  **Best reference here for how to write good skills.** Its
  [Skills collection](https://www.aihero.dev/skills) ships free, editable engineering
  **workflow** skills — `/grill-me`, `/domain-model`, `/to-prd`, `/to-issues`, `/tdd`,
  `/triage` (grouped Shaping / Upkeep / Productivity; `npx skills add mattpocock/skills`).
  Follow/learn + mine for ideas — don't install (hand-write-our-own policy); the authoring
  principles are the real value.
- [Learn Harness Engineering](https://walkinglabs.github.io/learn-harness-engineering/en/)
  — a course on **AI agent engineering**: how to build reliable "harnesses" that
  constrain and manage coding agents (e.g. Claude) to complete dev tasks. Covers
  why capable models still fail, and how to design the environment, manage state,
  and verify work.

## Design engineering & UI craft

- [Interface cheat-sheet](https://interfaces.dev/cheat-sheet) — **free, high-signal**
  checklist of design-engineering rules across UI, animation, typography, colour, a11y,
  layout, and writing (concentric radius, optical alignment, no `transition: all`,
  `tabular-nums`, `text-wrap: balance`/`pretty`, semantic colour tokens, `:focus-visible`,
  24/44px hit areas, `prefers-reduced-motion`, gap 2× between groups, verb-first button
  labels…). Much already matches our conventions (ADR 0024 a11y, the RHF form pattern, OKLCH
  tokens); the rest is a ready checklist for UI reviews. **Strong candidate to encode as a
  local, hand-written skill** — see the registries note below.
- [Interfaces](https://interfaces.dev/) — Jakub Krehel's subscription **design-engineering
  magazine** (animation, typography, OKLCH colour, UI polish, accessibility as craft;
  interactive demos + code + its own agent skills + Discord; ~$8/mo). Follow/learn — the
  bundled skills are subscription content, not something we install (we hand-write our own
  vetted skills).
- [UI Skills](https://www.ui-skills.com/) — by **ibelick** (motion-primitives, prompt-kit): a
  bundle of **4 design-engineering agent skills** (`SKILL.md`) for distinctive, non-generic UI
  — animation-duration + typography-scale enforcement, accessibility + layout-anti-pattern
  checks, GSAP motion + microinteractions. Same category as the interface cheat-sheet above.
  **Browse for ideas, don't install** (community skills; our policy is hand-write our own).
  Best distilled — together with the interfaces.dev cheat-sheet — into one local
  `interface-guidelines` skill.

## Agent-skill registries & tools (evaluated — NOT adopted)

We hand-write our own vetted skills instead of installing third-party ones
(private/proprietary + supply-chain caution — see
[decisions/0011-project-mcp-servers.md](decisions/0011-project-mcp-servers.md)).
Kept as alternatives and to browse for skill _ideas_ only — do not `npx`-install
into this repo.

- [autoskills.sh](https://www.autoskills.sh/) — by midudev; `npx autoskills`
  auto-detects your stack and installs curated, SHA-256-verified skills.
  Best-hygiene of the registries; worth skimming for per-stack skill ideas
  (Next.js, React, Turborepo).
- [skills.sh](https://www.skills.sh/) — Vercel's "npm for agent skills"
  (`npx skills add`). Large registry spanning many tools.
- [skillsmp.com](https://skillsmp.com/) — community registry aggregating 2M+
  skills from GitHub; **no curation/vetting** — lowest trust.

## Techniques to revisit

- [wayfinder-maps](https://github.com/rengwu/wayfinder-maps) — implements Matt
  Pocock's **"wayfinder method"**: agents keep structured markdown _planning_
  records in `.plan/`, validated + visualized by a Go CLI + Claude plugin.
  Interesting durable agent-planning idea; parked (early — v0.2.0, niche) until we
  want structured agent planning.

## README & docs tooling

- [shieldcn — README Studio](https://shieldcn.dev/studio) — a Figma-style visual
  README builder: shadcn/ui-styled badges, header banners, download charts, and
  sponsor/contributor grids, exported as GitHub-flavored Markdown with adaptive
  light/dark `<picture>` markup (base: <https://shieldcn.dev>, docs:
  <https://shieldcn.dev/docs>). Evaluated 2026-07 — **not adopted**: most of its
  value is open-source _marketing_ (npm / stars / downloads / sponsors), which
  doesn't fit a private/proprietary product, and it adds a third-party image-host
  dependency versus our native GitHub CI/CodeQL status badges. Kept for reference —
  handy if `packages/ui` ever ships as a public design system, or for a personal /
  OSS project.
