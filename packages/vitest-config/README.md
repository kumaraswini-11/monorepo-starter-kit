# @workspace/vitest-config

Shared **Vitest** presets — source-only config package (ADR 0029).

## Entry points

| Import                           | What                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@workspace/vitest-config`       | `base` (node), `dom` (jsdom + Testing Library), `integration` (node, `*.integration.test.ts`) presets |
| `@workspace/vitest-config/setup` | jest-dom matcher registration (the `dom` preset's setup file)                                         |

DOM consumers add `jsdom` + `@testing-library/*` themselves (they resolve from the consumer) plus a
one-line `vitest.d.ts` for the matcher types. Integration consumers wire their own `globalSetup` /
`setupFiles` (the harness lives in `@workspace/db/testing`). See ADR
[0029](../../docs/decisions/0029-testing-strategy.md).
