# Bookmarks

A personal, versioned stash of links worth keeping — articles, videos, repos,
docs, talks; anything useful to revisit. Each entry carries a one-line note on
_what it is_ (and, when useful, _why it's here_), so future-me remembers the
point — a bare URL is as forgettable as a browser bookmark.

_Newest first within each section. Run `pnpm format` to keep it tidy._

## AI & agent engineering

- [AI Hero](https://www.aihero.dev/) — Matt Pocock's (Total TypeScript, ex-Vercel)
  AI-engineering education: "5 Agent Skills I Use Every Day," designing codebases
  so agents perform well, MCP tutorials. **Best reference here for how to write
  good skills.** Follow/learn, don't install.
- [Learn Harness Engineering](https://walkinglabs.github.io/learn-harness-engineering/en/)
  — a course on **AI agent engineering**: how to build reliable "harnesses" that
  constrain and manage coding agents (e.g. Claude) to complete dev tasks. Covers
  why capable models still fail, and how to design the environment, manage state,
  and verify work.

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
