# 0013. Relax `react-hooks/set-state-in-effect` for vendored shadcn components

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

We hold all code to a hard lint gate — `eslint --max-warnings 0` ([0003](0003-hard-lint-gate.md)).
shadcn/ui components are **vendored** into `packages/ui` (copied as-is; we own
them but don't author them). Adding the component set surfaced two warnings from
`react-hooks/set-state-in-effect` — in `carousel.tsx` and the `use-mobile` hook —
where the components intentionally sync from an external system inside an effect
(embla's carousel API, `matchMedia`). That is a legitimate `useEffect` use, it is
how shadcn ships the code, and the warnings would return on every
`shadcn add`/update.

## Decision

Relax **only** `react-hooks/set-state-in-effect`, and **only** for the vendored
source in `packages/ui` (`src/components/**`, `src/hooks/**`), via an override in
`packages/ui/eslint.config.js`. Everything else — every other rule, and all of
`apps/web` (our application code) — keeps the full hard gate.

## Consequences

- The gate stays strict for the code we write; the exception is one rule, in the
  vendored UI package, and it survives re-running `shadcn add`.
- If shadcn components later trip other rules, extend the override **deliberately**
  (don't widen it pre-emptively).
- This refines, rather than weakens, [0003](0003-hard-lint-gate.md): the hard gate
  remains the default, and vendored third-party UI is the single documented
  exception.
