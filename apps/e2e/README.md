# e2e

**Playwright** end-to-end tests against `apps/web` (ADR 0025). A dedicated workspace so
`@playwright/test` + browsers never enter the app bundle.

## Scripts

`test:e2e` (via `turbo test:e2e`, which builds `web` first) · `lint` · `typecheck`

`playwright.config.ts` runs the production build (`next start`) with the `webServer` as an
**array** — a future standalone backend becomes a second entry (ADR 0017), and the suite boots
both unchanged. Aligned to the vendored `playwright-best-practices` skill. See ADR
[0025](../../docs/decisions/0025-testing-strategy.md).
