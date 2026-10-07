# monorepo-starter-kit

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Private, proprietary monorepo — the foundation for a product that will face
compliance later, and the **reusable template** for the next one. **License `UNLICENSED`;
never open-source or publish any package.** Prefer minimal, well-evidenced changes over broad
rewrites.

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

Run from the repo root. **pnpm only** (`pnpm` / `pnpm dlx`; never `npm` / `npx` — the pinned
runtime declaration makes npm refuse by design). pnpm 11 and Node 24.21.0 are pinned and
self-installed (`packageManager`, `devEngines.runtime`); no nvm/Corepack.

| Task                                     | Command                        |
| ---------------------------------------- | ------------------------------ |
| Install                                  | `pnpm install`                 |
| Dev server                               | `pnpm dev`                     |
| Production build                         | `pnpm build`                   |
| Lint (hard gate: 0 warnings)             | `pnpm lint`                    |
| Typecheck (packages + root tooling)      | `pnpm typecheck`               |
| Format + sort imports (writes)           | `pnpm format`                  |
| Unit + component tests                   | `pnpm test`                    |
| Integration tests (real pg, Docker)      | `pnpm test:integration`        |
| E2E tests (Playwright)                   | `pnpm test:e2e`                |
| Story tests (browser mode)               | `pnpm --filter storybook test` |
| Dead code / unused deps                  | `pnpm knip`                    |
| New workspace package                    | `pnpm gen package`             |
| Boundaries (advisory while experimental) | `pnpm exec turbo boundaries`   |

Before treating a change as done, run
`pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm knip`. CI runs the
same gate (plus integration, e2e, Storybook, audit, dependency review, CodeQL) on only the
affected packages per PR, and fails on any error **or warning**.

**Audit before every commit.** The gate is necessary but not sufficient — beyond it,
self-review the diff against: coding standards & best practices; **DRY / SOLID**;
reusability, scalability, maintainability; **full compatibility with the involved
libraries' official docs** and their best practices; and **enterprise concerns**
(robustness, resource cleanup, error paths, CI, security). Fix what it surfaces, then
commit. Git hooks format/lint staged files and check the commit message; they are a
convenience, not the gate.

## Stack

- **pnpm 11** workspaces + **Turborepo 2.11**; **Node 24.21.0** pinned (`.nvmrc`, `devEngines.runtime`)
- **Next.js 16** (Turbopack) · **React 19** · **Tailwind CSS v4**
- UI: **shadcn/ui** built on **Base UI** (`@base-ui/react`) — not Radix (ADR 0021)
- **TypeScript 6** · **ESLint 10** (flat, type-aware) · **Prettier 3** · **Vitest 5** · **Playwright**

## Layout

- `apps/` — deployables only: `web` (Next.js), `storybook`
- `packages/` — `@workspace/*`, **source-only** (no build step), consumed via `exports` maps:
  `ui` (design system), `auth` / `db` / `email` / `env` (domain), `utils` (leaf), `e2e`
  (Playwright harness), `eslint-config` / `typescript-config` / `vitest-config` (presets)
- `turbo/generators/` — the package scaffold · `docs/` — `decisions/` (ADRs), `guides/` (how-to),
  `audits/`, `future-improvements.md`, `references.md`
- Full map + placement rules: `docs/guides/repository-structure.md`

## Conventions

- **Prettier owns all formatting**, run once from the root. Import order is enforced
  by `@ianvs/prettier-plugin-sort-imports`; keep `prettier-plugin-tailwindcss`
  **last**. Never hand-format or add ESLint stylistic rules. (ADR 0004, 0010)
- **Single-version dependency policy (`catalogMode: strict`, ADR 0034):** every third-party
  dependency is declared once in the `pnpm-workspace.yaml` catalog and referenced as `catalog:`
  from manifests — never an inline version. Add with `pnpm add --filter <pkg> --catalog <dep>`;
  group and comment the catalog entry. Lockstep families (Vitest, Storybook, Playwright, turbo,
  React+Next) move together.
- **Supply chain:** new versions wait 24h (`minimumReleaseAge`); lifecycle scripts only when
  allow-listed (`allowBuilds`); `pnpm dlx <pkg>@<version>`, never `@latest`. Don't disable any of
  it; justify every new dependency by where it runs (ADR 0033).
- **Dependency updates (Dependabot / taze / manual) — verify, never blind-merge.** Read the
  official changelog (mandatory for majors), run the full gate (+ Storybook build/test if
  UI-affecting), write an ADR for a major that changes how we work. Deferred majors carry a
  named trigger in `docs/future-improvements.md` and a Dependabot `ignore`. (ADR 0033)
- **Toolchain pins** (`packageManager`, `.nvmrc`, `devEngines.runtime`, action SHAs) are
  exact and bumped deliberately; EOL is a hard upgrade trigger. (ADR 0033)
- **Package boundaries (ADR 0016, 0036):** import a package only through its `exports`
  (never `src/`), never add `paths` aliases for workspace packages (self-reference by name
  instead), keep the direction `utils` → domain → `ui` → apps (Boundaries tags in each
  `turbo.json`). Server modules start with `import "server-only"`. Read config only via
  `@workspace/env` (ADR 0013); a build-time variable goes in the task's `env` in `turbo.json`
  (ADR 0035).
- **New package = `pnpm gen package`** (then `pnpm install`). Never copy a sibling by hand.
- **UI components:** follow the existing shadcn + Base UI pattern in `packages/ui`. These are
  **vendored source we own** — never blind `shadcn add --overwrite` (it silently restores upstream
  keyframes/Radix attrs and wipes our deviations). To update or add one: review the upstream diff,
  re-apply our documented deviations (`grep -rn "Deviation\|ADR 00" packages/ui/src/components/shadcn`),
  and use our **CSS-transition** animation idiom (not `tw-animate-css` keyframes) — check first, then
  gate incl. Storybook build. The vendored tree has a scoped lint exemption; our own code does not. (ADR 0030, 0033)
- **Component placement & shape (ADR 0016, 0026):** atomic-design as a _lens_ to pick the home
  — no literal `atoms/molecules/organisms` folders. **`@workspace/ui`** is the single design
  system (atoms + agnostic _and_ form-bound molecules; `react-hook-form` is a deliberate `ui`
  dep); **feature organisms** (e.g. `SignInForm`) live in the app under
  `apps/*/features/<feature>/` (ADR 0028). Proven-generic UI → `ui` from the start; _uncertain_
  ones wait for a 2nd consumer. **Shape:** generic inputs (a `name`, not a `user`) + a sensible
  default + one escape hatch — no per-entity wrappers, no prop-explosion.
- **Record notable decisions as ADRs** in `docs/decisions/` (copy the latest `NNNN-title.md`
  format and update the index); amend an old ADR with a dated note rather than rewriting it.
  Log deferred work in `docs/future-improvements.md` **with a trigger**. Update `docs/guides/`
  when a workflow changes.
- **Conventional Commits**, one logical change per commit (enforced by commitlint and the PR
  title check; squash merges). (ADR 0037)
- Treat the **shadcn / create-turbo output as the baseline**; deviate only with
  authoritative evidence, and write an ADR when you do. (ADR 0001)
- **Editor-agnostic:** tool-native configs + `.editorconfig`; no editor-specific directory.

## Don't

- Don't open-source, add public license text, or set `publishConfig` — every package
  is private / `UNLICENSED`. (ADR 0002, 0008)
- Don't bypass the lint gate, disable Prettier, skip hooks, or commit with failing checks.
- Don't major-upgrade pnpm (12), TypeScript (7) or Node (26) without checking the named
  trigger in `docs/future-improvements.md` first — each is deliberately dated. (ADR 0033)
- Don't use `npm`/`npx`, inline dependency versions, `paths` aliases, or `@latest` in `dlx`.

## More

Contribution flow: `CONTRIBUTING.md`. Security policy: `SECURITY.md`. How-to guides:
`docs/guides/`. The reasoning behind the rules above lives in `docs/decisions/`; the latest
foundation audit in `docs/audits/`.

> **Editing this file:** it loads every session, so keep it a **lean handbook** — for each
> line ask _"would removing this make an agent err?"_; if not, cut it. Push detail to an
> ADR/guide and leave a pointer (a bloated file gets ignored). The two managed blocks
> (`nextjs-agent-rules`, `turborepo-agent-rules`) are written by `next dev` / `turbo` — keep
> them committed, don't edit them. See
> [Anthropic — Best practices for Claude Code](https://code.claude.com/docs/en/best-practices).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
