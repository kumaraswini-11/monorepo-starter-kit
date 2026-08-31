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
  `/triage` (grouped Shaping / Upkeep / Productivity). **Adopted** — vendored + hash-pinned
  via `npx skills add mattpocock/skills` (`skills-lock.json`), alongside the first-party
  better-auth / shadcn / vercel sets, per the refined policy in
  [decisions/0010](decisions/0010-agent-skills-vendoring.md) (reputable first-party/known-author
  skill sets in; unvetted community registries below stay browse-only).
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
  labels…). Much already matches our conventions (ADR 0020 a11y, the RHF form pattern, OKLCH
  tokens). Now **adopted first-party**: Jakub publishes these as free agent skills on GitHub
  (`jakubkrehel/skills`) — the vendored `better-*` set (see ADR 0010) — so the rules are
  applied directly in-repo, no hand-written copy needed.
- [Jakub Krehel](https://jakub.kr/) — personal site of the **interfaces.dev** author
  (design engineer). Source of the `better-*` interface skills we vendor; follow for
  design-engineering craft.
- [Interfaces](https://interfaces.dev/) — Jakub Krehel's subscription **design-engineering
  magazine** (animation, typography, OKLCH colour, UI polish, accessibility as craft;
  interactive demos + code + Discord; ~$8/mo). The **magazine** is paid subscription content;
  the **agent skills are free/OSS** (`jakubkrehel/skills`) and are what we vendor. Follow the
  magazine for craft, read the skills in-repo.
- [UI Skills](https://www.ui-skills.com/) — by **ibelick** (motion-primitives, prompt-kit): a
  bundle of **4 design-engineering agent skills** (`SKILL.md`) for distinctive, non-generic UI
  — animation-duration + typography-scale enforcement, accessibility + layout-anti-pattern
  checks, GSAP motion + microinteractions. Same domain as the vendored `better-*` skills above,
  which now cover this ground first-party. **Browse for extra ideas** (community skills); no
  need to adopt.
- [Animations on the Web](https://animations.dev/) — **Emil Kowalski**'s (design engineer,
  Linear/ex-Vercel) interactive course on web animation: easing/spring/timing, CSS +
  **Motion (Framer Motion)**, performance, a11y, gestures, SVG, motion psychology; bundles
  ~12 AI skills + Discord (paid). The authority on motion craft for our stack (Motion/React).
  Follow/learn — the bundled skills are course content, not something we vendor.

## Agent-skill registries & tools (evaluated — NOT adopted)

We adopt only **reputable first-party / known-author** skill sets, vendored and
hash-pinned (`skills-lock.json`); these **unvetted community registries** stay
browse-only — kept for skill _ideas_, not `npx`-installed into this repo
(private/proprietary + supply-chain caution — see
[decisions/0010-agent-skills-vendoring.md](decisions/0010-agent-skills-vendoring.md)).

- [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — by
  **VoltAgent**: a curated **"awesome list"** of 1000+ agent skills, organized by provider
  (Anthropic, Google, Stripe, Vercel, Microsoft…) and hand-picked from real engineering
  teams rather than mass AI-generated. Not a registry/installer — a directory. **Best
  starting point to discover reputable first-party skills** worth vendoring (per ADR 0010);
  browse, then `skills add` the vetted ones.
- [autoskills.sh](https://www.autoskills.sh/) — by midudev; `npx autoskills`
  auto-detects your stack and installs curated, SHA-256-verified skills.
  Best-hygiene of the registries; worth skimming for per-stack skill ideas
  (Next.js, React, Turborepo).
- [skills.sh](https://www.skills.sh/) — Vercel's "npm for agent skills"
  (`npx skills add`). Large registry spanning many tools.
- [skillsmp.com](https://skillsmp.com/) — community registry aggregating 2M+
  skills from GitHub; **no curation/vetting** — lowest trust.

## UI libraries to evaluate

Candidate **client runtime** deps — so bundle size matters (ADR-adjacent dep-weight
policy: keep server-only where possible, lazy-load heavy ones via `next/dynamic`). Not
adopted; listed for when a real need lands.

- [Liveline](https://benji.org/liveline) — lightweight, **zero-dependency** (React 18+)
  real-time animated line chart on a **single `<canvas>`**: smooth 60fps interpolation,
  momentum arrows, value overlays, time windows, candlesticks, multi-series. For live
  feeds (prices, prediction markets) where a heavy charting lib is overkill. Canvas +
  no deps means it's cheap and easy to lazy-load behind `next/dynamic`.
- [React Virtuoso](https://virtuoso.dev/) — the most complete React **virtualization**
  library: lists, grids, tables (variable-size items, sticky columns, row grouping),
  masonry, and chat/Message List. Reach for it when a list/table grows long enough to
  need windowing. **Mostly MIT**; premium chat features are commercially licensed —
  check the license per component before adopting.

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

## UI component galleries & design references (to explore)

A dump of inspiration + component sources to browse later — shadcn-style component
libraries, UI galleries, and design-token / checklist references. **Not adopted; notes
are provisional until each is visited.** Any client-runtime component is still judged on
bundle weight before adoption (dep-weight policy), and third-party libraries against
[decisions/0021](decisions/0021-base-ui-selection-and-adoption.md) (Base UI over Radix) —
so these are idea sources, not drop-ins.

- [Refero](https://styles.refero.design/) — searchable gallery of real product UI
  screenshots; interaction/design inspiration.
- [reui](https://reui.io/components) — open-source shadcn/Base-UI-flavoured component
  collection (animated + data components); same lineage as our stack.
- [Design System Checklist](https://designsystemchecklist.com/) — open checklist for
  building/auditing a design system (foundations → components → governance).
- [Emil Kowalski — You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations)
  — essay on motion restraint from the [animations.dev](https://animations.dev/) author;
  complements our reduced-motion stance (ADR 0020).
- [transitions.dev](https://transitions.dev/) — CSS transition/animation reference _(to verify)_.
- [BuninUX — Design Tokens](https://buninux.com/design-tokens) — design-tokens reference
  _(to verify)_.
- [beautifului.dev](https://beautifului.dev/) — UI component / design resource _(to verify)_.
- [beui.dev](https://beui.dev/) — UI component kit _(to verify)_.
- [rareui.com](https://rareui.com/) — UI component collection _(to verify)_.
- [coss.com/ui](https://coss.com/ui) — UI component resource _(to verify)_.
- [awesome-ai-apps](https://github.com/Arindam200/awesome-ai-apps#-featured-ai-apps) —
  curated list of AI/agent app examples + featured demos; build references for AI features.
- [shadcn/ui](https://ui.shadcn.com/) — source of our vendored components and the
  design-system baseline (ADR 0021); reference for new blocks/components.

_(Already bookmarked above under "Design engineering & UI craft":
[UI Skills](https://www.ui-skills.com/).)_
