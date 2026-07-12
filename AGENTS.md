# monorepo-starter-kit

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Private, proprietary monorepo — the foundation for a product that will face
compliance later. **License `UNLICENSED`; never open-source or publish any
package.** Prefer minimal, well-evidenced changes over broad rewrites.

## Commands

Run from the repo root. **This repo uses `pnpm` only** (enforced via
`packageManager` + `engine-strict`) — never `npm` or `yarn`.

| Task                           | Command          |
| ------------------------------ | ---------------- |
| Install                        | `pnpm install`   |
| Dev server                     | `pnpm dev`       |
| Production build               | `pnpm build`     |
| Lint (hard gate: 0 warnings)   | `pnpm lint`      |
| Typecheck                      | `pnpm typecheck` |
| Format + sort imports (writes) | `pnpm format`    |

Before treating a change as done, run
`pnpm format && pnpm lint && pnpm typecheck && pnpm build`. CI runs
`prettier --check .` and `turbo run lint typecheck build`, and fails on any error
**or warning**.

## Stack

- **pnpm 10** workspaces + **Turborepo**; **Node ≥ 20** (pinned via `packageManager`)
- **Next.js 16** (Turbopack) · **React 19** · **Tailwind CSS v4**
- UI: **shadcn/ui** built on **Base UI** (`@base-ui/react`) — not Radix (ADR 0007)
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
  **last**. Never hand-format or add ESLint stylistic rules. (ADR 0002, 0010)
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
- **UI components:** follow the existing shadcn + Base UI pattern in `packages/ui`.
- **Record notable decisions as ADRs** in `docs/decisions/` (copy the existing
  `NNNN-title.md` format and update the index). Log deferred work in
  `docs/future-improvements.md`.
- **Conventional Commits**, one logical change per commit.
- Treat the **shadcn / create-turbo output as the baseline**; deviate only with
  authoritative evidence, and write an ADR when you do. (ADR 0005)

## Don't

- Don't open-source, add public license text, or set `publishConfig` — every package
  is private / `UNLICENSED`. (ADR 0001, 0008)
- Don't bypass the lint gate, disable Prettier, or commit with failing checks.
- Don't major-upgrade tooling (pnpm 11, TypeScript 7, ESLint 10) without checking
  `docs/future-improvements.md` first — several are deliberately deferred. (ADR 0004)

## More

Contribution flow: `CONTRIBUTING.md`. Security policy: `SECURITY.md`. The reasoning
behind the rules above lives in `docs/decisions/`.
