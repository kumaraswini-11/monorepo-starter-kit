# 0004. Stay on TypeScript 5.x / ESLint 9; defer TS 7 & ESLint 10

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

- **TypeScript 7.0** (the Go-native compiler, ~10× faster) reached GA on
  2026-07-08. However, the TypeScript team explicitly states that
  **typescript-eslint** — which our entire ESLint setup depends on — should wait
  for **TS 7.1** (~Oct 2026) before using the new programmatic API.
- **ESLint 10** is released, but `eslint-plugin-react` and `eslint-config-next`
  do not yet declare ESLint 10 peer support.

Both are cases where the tool is ready but the plugin ecosystem is not.

## Decision

Keep `"typescript": "^5"` and `"eslint": "^9"` across all packages. Do **not**
adopt TS 7 or ESLint 10 yet. (The `^5` / `^9` ranges won't auto-upgrade across
majors, so this is the safe default.)

## Consequences

- Stable, fully-supported tooling now; no broken lint.
- **Revisit TS 7** when 7.1 ships and typescript-eslint declares support — then
  it's a one-line bump to `^7` for a large typecheck speedup.
- **Revisit ESLint 10** when `eslint-plugin-react` / `eslint-config-next`
  declare support.
