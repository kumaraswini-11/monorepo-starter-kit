# 0027. Class merging — keep `clsx` + `tailwind-merge`; defer shadcn's `cn` engine

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

Every component in `@workspace/ui` composes class names through one helper,
`packages/ui/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`clsx` resolves conditional class logic; `tailwind-merge` resolves Tailwind class **conflicts**
(so `px-2` + `px-4` collapses to `px-4`). This is the shadcn baseline
([0001](0001-decision-making-methodology.md)).

shadcn has since shipped **`cn`** (<https://github.com/shadcn-ui/cn>, MIT) — a from-scratch engine
that **replaces both** `clsx` and `tailwind-merge` ("same APIs, full parity, 30× faster"), plus a
codemod, **`npx shadcn migrate cn`**, that rewrites the helper to re-export from `cn` and drops the
two dependencies. The question: adopt it now?

Per the repo ethos (evidence over novelty; supply-chain caution; enterprise/template bar), this is
recorded as a **considered-and-deferred** decision so it is not re-litigated each time the command
resurfaces.

## What `cn` / `migrate cn` is

- A single package (`npm i cn`) that merges `clsx` + `tailwind-merge` behind the same API, with an
  optional ahead-of-time `cn build` step that pre-resolves classes for the "30× faster" claim.
- `npx shadcn migrate cn` swaps our `twMerge(clsx())` helper for a re-export from `cn` and removes
  `clsx` + `tailwind-merge`. **Blast radius in this repo is tiny** — `clsx`/`tailwind-merge` appear
  in only `packages/ui/src/lib/utils.ts`, `packages/ui/package.json`, and the lockfile
  (`class-variance-authority` keeps its own `clsx` transitively, so `cva` is unaffected).

## Questions & critiques interrogated

- **"30× faster — free win?"** No. Class merging is **not an app bottleneck**: `twMerge` is
  sub-millisecond and effectively per-render cached; 30× faster than negligible is still
  negligible. The speed comes from an AOT `cn build` step whose **own caveat — "dynamically
  constructed class names cannot be detected"** — collides with how we build classes (`cva`
  variants, `group-data-*` composition, arbitrary values like `ease-snappy`/`data-vertical:*`). The
  headline benefit either doesn't apply at runtime or risks missing our dynamic classes.
- **"Smaller / less to ship?"** No. `cn` is **~26 KB minified** — not smaller than `clsx` (~0.5 KB)
  - `tailwind-merge`, and it is a **client-runtime** dependency, the one place our dep-weight policy
    says size matters (AGENTS.md). No bundle win.
- **"Full parity — drop-in?"** Claimed, but `tailwind-merge`'s entire value **is** its years of
  maintained Tailwind conflict-resolution edge cases (now including v4 + arbitrary values + custom
  theme tokens). A brand-new engine ("classes that merely _look like_ utilities are treated as
  utilities") risks **subtle merge regressions across every vendored component** — high blast
  radius, hard to catch.
- **"It's from shadcn, so it's safe."** Provenance ≠ maturity. The package is a **v0** (no released
  version/date; ~29 commits) replacing two of the most battle-tested libraries in the ecosystem.
  Our **`minimumReleaseAge` cooldown would block it** anyway, and that policy exists precisely for
  "shiny new package."
- **"Just run the codemod."** Running the **shadcn CLI inside our monorepo** is itself risky — it
  targets stock single-app Radix shadcn, whereas we are **source-only `@workspace/ui`, a custom
  `components.json`, and Base UI** ([0021](0021-base-ui-selection-and-adoption.md)); it could touch
  the wrong package/config. If we ever adopt, it is a **3-file manual edit**, not a CLI run.

## Decision

**Keep `clsx` + `tailwind-merge`** as the class-merge stack; **defer `cn`.** The current
`twMerge(clsx())` helper is the correct, boring, stable choice for a compliance-bound,
template-reusable base. No dependency change; no `migrate cn` run.

The bar `cn` must clear before we revisit: a **stable, widely-adopted 1.x**, **past our
`minimumReleaseAge` cooldown**, with **proven Tailwind-v4 conflict-resolution parity**. Even then,
adopt **manually** (swap `utils.ts` + `package.json`, drop the two deps), run the full gate, and
record it as a deviation from this baseline — never via the CLI.

## Consequences

- Zero change now; class merging stays on the two ubiquitous, battle-tested libraries.
- We forgo a performance improvement that is **immaterial** to a normal app, avoiding a real risk
  of subtle class-merge regressions and a v0 supply-chain exposure.
- The `cn` option is captured (here + `../future-improvements.md`) so it is evaluated on the merits
  at the revisit trigger, not adopted on hype.

## Revisit triggers

- `cn` reaches a **stable 1.x** with sustained real-world adoption and a maintenance track record,
  **past our cooldown**, with documented Tailwind-v4 parity → re-evaluate (manual swap + gate +
  note the deviation).
- We adopt **pnpm 11** or otherwise change the cooldown policy → re-check whether the calculus
  shifts (it should not, absent the maturity above).

## Sources

- shadcn `cn` engine — <https://github.com/shadcn-ui/cn> (API, `cn build`, 26 KB, Tailwind-v4
  prefix support, MIT).
- `clsx` — <https://github.com/lukeed/clsx>; `tailwind-merge` — <https://github.com/dcastil/tailwind-merge>
  (the maintained Tailwind conflict-resolution engine, incl. v4).
- Supply-chain posture (`minimumReleaseAge`, prefer widely-used/maintained, dep-weight) — `AGENTS.md`
  and [0006](0006-defer-typescript-7-and-eslint-10.md) (ecosystem-readiness deferrals).

See [0001](0001-decision-making-methodology.md) (shadcn baseline; deviate only with evidence),
[0021](0021-base-ui-selection-and-adoption.md) (why the shadcn CLI doesn't fit our Base-UI variant),
and [../future-improvements.md](../future-improvements.md) (deferred-with-trigger backlog).
