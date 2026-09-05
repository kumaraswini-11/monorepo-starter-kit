# monorepo-starter-kit

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Private, proprietary monorepo — the foundation for a product that will face
compliance later. **License `UNLICENSED`; never open-source or publish any
package.** Prefer minimal, well-evidenced changes over broad rewrites.

## Build for the enterprise — and push back with evidence

This is an enterprise-grade, compliance-bound, **template-reusable** foundation. Optimize every
decision for the long term — **scalability, reusability, isolation, maintainability, standards,
and a future separate-backend split (ADR 0017)** — **never** for "make it work for now,"
"fast-start," or short-term convenience. When a path trades long-term correctness for speed, take
correctness and record the trade-off.

When the user proposes a tool, library, or approach, **do not just agree.** Research it against
those goals (official docs + reputable, current comparisons), **critique it honestly** — steelman
the alternatives and name the trade-offs, lock-in, and compliance/scale implications — then give
the **best option as a clear, evidence-backed recommendation, even when it contradicts the
proposal.** "Yes sir / no sir" is not the job; rigorous engineering judgment is. When asked for
clarity, lead with the R&D and reasoning, then decide together.

## Commands

Run from the repo root. **This repo uses `pnpm` only** (enforced via
`packageManager` + `engine-strict`) — never `npm` or `yarn`.

| Task                           | Command                 |
| ------------------------------ | ----------------------- |
| Install                        | `pnpm install`          |
| Dev server                     | `pnpm dev`              |
| Production build               | `pnpm build`            |
| Lint (hard gate: 0 warnings)   | `pnpm lint`             |
| Typecheck                      | `pnpm typecheck`        |
| Format + sort imports (writes) | `pnpm format`           |
| Unit + component tests         | `pnpm test`             |
| Integration tests (real pg)    | `pnpm test:integration` |
| E2E tests (Playwright)         | `pnpm test:e2e`         |

(`test:integration` needs Docker running — Testcontainers spins up an ephemeral `postgres:17`;
`test:e2e` needs a **disposable** Postgres via `DATABASE_URL` — the docker-compose `app` DB
locally, a service in CI — which global-setup wipes each run. See ADR 0025.)

Before treating a change as done, run
`pnpm format && pnpm lint && pnpm typecheck && pnpm build`. CI runs
`prettier --check .` and `turbo run lint typecheck build`, and fails on any error
**or warning**.

**Audit before every commit.** The gate is necessary but not sufficient — beyond it,
self-review the diff against: coding standards & best practices; **DRY / SOLID**;
reusability, scalability, maintainability; **full compatibility with the involved
libraries' official docs** and their best practices; and **enterprise concerns**
(robustness, resource cleanup, error paths, CI, security). Fix what it surfaces, then
commit. This is a private, compliance-bound, template-reusable monorepo — every commit is
held to that bar. (Run tests too where they exist: `pnpm test` / `pnpm test:integration`.)

## Stack

- **pnpm 10** workspaces + **Turborepo**; **Node ≥ 24** LTS (pnpm pinned via `packageManager`; Node via `.nvmrc`/`engines`)
- **Next.js 16** (Turbopack) · **React 19** · **Tailwind CSS v4**
- UI: **shadcn/ui** built on **Base UI** (`@base-ui/react`) — not Radix (ADR 0021)
- **TypeScript 5** · **ESLint 9** (flat config) · **Prettier 3**

## Layout

- `apps/web` — the Next.js application
- `packages/ui` — shared components (`@workspace/ui`); **source-only** (no build
  step), consumed directly via its `exports` map. Add components in `src/components/`.
- `packages/eslint-config`, `packages/typescript-config` — shared configs
- `docs/` — `decisions/` (ADRs), `future-improvements.md`, `references.md`, `bookmarks.md`

## Conventions

- **Prettier owns all formatting**, run once from the root. Import order is enforced
  by `@ianvs/prettier-plugin-sort-imports`; keep `prettier-plugin-tailwindcss`
  **last**. Never hand-format or add ESLint stylistic rules. (ADR 0004, 0010)
- **Cross-package dependency versions go through pnpm catalogs**: use `catalog:` in
  `package.json` and pin the version in `pnpm-workspace.yaml`. Package-only deps may
  be inlined. Never inline a version for something two packages share.
- **Supply chain:** new packages sit behind `minimumReleaseAge`; prefer widely-used,
  maintained deps and justify additions. Don't disable the cooldown.
- **Dependency weight:** judge a dep by _where it runs_. Dev tooling (devDeps)
  never ships — weigh it on maintenance + supply-chain, not size. Client runtime
  deps are the only place bundle size matters — prefer small/tree-shakeable, keep
  server-only where possible, and lazy-load heavy ones (`next/dynamic`, e.g.
  charts). Source components (shadcn) are free until imported; unused code costs
  nothing (tree-shaking + per-route code-splitting). Keep the catalog fresh with
  `pnpm deps:check` (taze) — Dependabot doesn't track catalog entries.
- **Dependency updates (Dependabot / taze / manual) — verify, never blind-merge.**
  Treat every version bump as a change to check, not trust. Before merging:
  **(1)** confirm whether our code needs changes and that it's **compatible** — read
  the package's **official changelog / release notes** for breaking changes
  (mandatory for majors; minor/patch are SemVer-safe but still verified); **(2)** run
  the full gate (`pnpm format && lint && typecheck && build`, plus
  `pnpm --filter storybook build:storybook` if UI-affecting) — green is the
  compatibility proof; **(3)** for a major, follow the migration guide and add an ADR
  if it changes how we work. `taze` also reorders/tightens manifests — **audit its
  diff** before committing.
- **UI components:** follow the existing shadcn + Base UI pattern in `packages/ui`.
- **Component placement & shape (ADR 0016, 0026):** atomic-design as a _lens_ to pick the home
  — no literal `atoms/molecules/organisms` folders. **`@workspace/ui`** is the single design
  system (atoms + agnostic _and_ form-bound molecules; `react-hook-form` is a deliberate `ui`
  dep); **feature organisms** (e.g. `SignInForm`) live in the app under
  `apps/*/components/<feature>/`. Proven-generic UI → `ui` from the start; _uncertain_ ones wait
  for a 2nd consumer. **Shape:** generic inputs (a `name`, not a `user`) + a sensible default +
  one escape hatch — no per-entity wrappers, no prop-explosion.
- **Record notable decisions as ADRs** in `docs/decisions/` (copy the existing
  `NNNN-title.md` format and update the index). Log deferred work in
  `docs/future-improvements.md`.
- **Conventional Commits**, one logical change per commit.
- Treat the **shadcn / create-turbo output as the baseline**; deviate only with
  authoritative evidence, and write an ADR when you do. (ADR 0001)

## Don't

- Don't open-source, add public license text, or set `publishConfig` — every package
  is private / `UNLICENSED`. (ADR 0002, 0008)
- Don't bypass the lint gate, disable Prettier, or commit with failing checks.
- Don't major-upgrade tooling (pnpm 11, TypeScript 7, ESLint 10) without checking
  `docs/future-improvements.md` first — several are deliberately deferred. (ADR 0006)

## More

Contribution flow: `CONTRIBUTING.md`. Security policy: `SECURITY.md`. The reasoning
behind the rules above lives in `docs/decisions/`.

> **Editing this file:** it loads every session, so keep it a **lean handbook** — for each
> line ask _"would removing this make an agent err?"_; if not, cut it. Push detail to an
> ADR/skill and leave a pointer (a bloated file gets ignored). See
> [Anthropic — Best practices for Claude Code](https://code.claude.com/docs/en/best-practices).
