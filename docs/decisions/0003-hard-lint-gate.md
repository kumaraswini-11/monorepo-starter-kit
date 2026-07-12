# 0003. Hard lint gate (`--max-warnings 0`)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The shadcn template ships `"lint": "eslint"`, and the shared ESLint config uses
`eslint-plugin-only-warn` (which downgrades all errors to warnings). Together,
`eslint` always exits `0` — so `turbo lint` **can never fail CI**. That is a
soft gate that defeats the purpose of linting.

## Decision

Set the per-package lint scripts to:

```jsonc
"lint": "eslint --max-warnings 0"
```

Keep `eslint-plugin-only-warn`.

## Consequences

- Issues still render as (yellow) **warnings** in the editor — low noise during
  development — but CI **fails if any warning exists**. A true hard gate.
- Matches `create-turbo`, which uses exactly `eslint --max-warnings 0` with the
  same `only-warn` plugin — see [0005](0005-follow-shadcn-baseline.md).
