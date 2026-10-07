# 0005. Lint gate + vendored-UI exception

- **Status:** Accepted
- **Date:** 2026-07-12
- **Amended:** 2026-10-07 — `eslint-plugin-only-warn` is removed (with `--max-warnings 0` the CI outcome is identical, but it erased error/warning semantics in editors); the vendored exception is now a documented block of idiom/typing rules scoped to `packages/ui/src/components/shadcn/**` — see `packages/ui/eslint.config.js` and [0033](0033-toolchain-version-policy-and-2026-10-modernization.md).

## Context

The shadcn template ships `"lint": "eslint"`, and the shared ESLint config uses
`eslint-plugin-only-warn` (which downgrades all errors to warnings). Together,
`eslint` always exits `0` — so `turbo lint` **can never fail CI**. That is a
soft gate that defeats the purpose of linting.

Separately, shadcn/ui components are **vendored** into `packages/ui` (copied
as-is; we own them but don't author them). Adding the component set surfaced two
warnings from `react-hooks/set-state-in-effect` — in `carousel.tsx` and the
`use-mobile` hook — where the components intentionally sync from an external
system inside an effect (embla's carousel API, `matchMedia`). That is a
legitimate `useEffect` use, it is how shadcn ships the code, and the warnings
would return on every `shadcn add`/update.

## Decision

### Hard lint gate (`--max-warnings 0`)

Set the per-package lint scripts to:

```jsonc
"lint": "eslint --max-warnings 0"
```

Keep `eslint-plugin-only-warn`.

### Vendored-UI exception — relax `react-hooks/set-state-in-effect`

Relax **only** `react-hooks/set-state-in-effect`, and **only** for the vendored
source in `packages/ui` (`src/components/**`, `src/hooks/**`), via an override in
`packages/ui/eslint.config.js`. Everything else — every other rule, and all of
`apps/web` (our application code) — keeps the full hard gate.

## Consequences

- Issues still render as (yellow) **warnings** in the editor — low noise during
  development — but CI **fails if any warning exists**. A true hard gate.
- Matches `create-turbo`, which uses exactly `eslint --max-warnings 0` with the
  same `only-warn` plugin — see [0001](0001-decision-making-methodology.md).
- The gate stays strict for the code we write; the exception is one rule, in the
  vendored UI package, and it survives re-running `shadcn add`.
- If shadcn components later trip other rules, extend the override **deliberately**
  (don't widen it pre-emptively).
- This **refines, rather than weakens**, the hard gate: the hard gate remains the
  default, and vendored third-party UI is the single documented exception. The
  same "extend deliberately, don't pre-widen" reasoning governs the jsx-a11y
  adjustments recorded in [0021](0021-base-ui-selection-and-adoption.md).
