# 0018. Adopt Storybook (phased) for the UI library; visual testing deferred

- **Status:** Accepted (strategy) — Phase 0/1 to execute after this ADR is approved
- **Date:** 2026-08-01

## Context

`packages/ui` (`@workspace/ui`) is a shared, source-only library of ~51
shadcn/Base UI components. It has **no isolated development environment, no
component documentation, and no component/visual tests** — components are only
ever seen inside `apps/web`. As the library and team grow, we want:

- **Isolated component development** (build/see a component without the whole app),
- **Living documentation** (props, variants, states) for the design system,
- **Component + accessibility testing** (ties to the a11y work in
  [0014](0014-base-ui-adoption.md)).

Storybook is the industry-standard tool for this. Chromatic (by the Storybook
team) adds visual-regression testing + hosting. Because this is a **private,
proprietary, compliance-bound** product with a **minimal / dependency-weight-
conscious** ethos, "should we adopt this _now_?" was evaluated as seriously as
"how."

### How we decided

Two adversarially-verified deep-research passes (per the
[0005](0005-follow-shadcn-baseline.md) methodology), plus direct official-docs
verification where a research pass failed. Findings are cited below; the
**adopt-vs-defer verdict is a synthesized judgment**, not an independently voted
claim. Time-sensitive: anchored to **Storybook 10.x, mid-2026**.

## Decision

1. **Adopt Storybook — but phase it. Do not stand up the full stack at once.**
2. **Version & framework:** Storybook **10** with **`@storybook/nextjs-vite`** (the
   Vite builder), _not_ the Webpack `@storybook/nextjs`.
3. **Placement:** a **dedicated `apps/storybook` app**, with **story files
   co-located** next to components in `packages/ui` (the app's `stories` glob
   points into the package). **Not** inside `packages/ui`, **not** in `apps/web`.
4. **Vite is dev-only and bundle-safe** — see the concern resolved below.
5. **Defer Chromatic / visual regression to Phase 3**, pending a compliance
   sign-off on its cloud model. **Publishing target (Chromatic vs self-hosted
   behind SSO) is deferred to deploy time (Phase 4).**
6. **Reject the lighter alternatives** (Ladle, Histoire) — they'd sacrifice the
   exact features we want (a11y, visual regression, ecosystem).
7. **Component-library structure:** vendored shadcn primitives live in
   `packages/ui/src/components/shadcn/`; custom / composed components go at the
   `components/` top level. Keeps the vendored/custom split obvious and stops
   co-located stories from cluttering the flat folder — see below.

## Verified findings (from the R&D)

### Version & compatibility

| Fact                                                      | Detail                                                                                                                                                    | Source                                                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Current major is **Storybook 10**                         | Released 28 Oct 2025; **ESM-only** (−29% install size). ("Storybook 9" was a stale premise.)                                                              | [SB10 blog](https://storybook.js.org/blog/storybook-10/), [migration guide](https://storybook.js.org/docs/releases/migration-guide) |
| **Next.js 16 supported**                                  | Explicitly added in SB 10; Next 16.2 needs **SB ≥ 10.3**.                                                                                                 | [SB10 blog](https://storybook.js.org/blog/storybook-10/)                                                                            |
| Framework = **`@storybook/nextjs-vite`**                  | Vite-based, auto-selected unless custom Webpack/Babel exists; `@storybook/nextjs` (Webpack 5) is the fallback.                                            | [nextjs-vite docs](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)                                                |
| ⚠️ **RSC is experimental only**                           | Behind `features: { experimentalRSC: true }`; wraps stories in a **client-side Suspense** wrapper, not true server rendering.                             | [nextjs-vite docs](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)                                                |
| ⚠️ **Node 20.19+ / 22.12+ required**                      | Our `engines.node` is a bare `">=20"` — insufficient.                                                                                                     | [migration guide](https://storybook.js.org/docs/releases/migration-guide)                                                           |
| **`@storybook/addon-vitest`** is the modern test workflow | Supersedes the Playwright test-runner; **only works on Vite builders** (needs **Vite 6+**) — so the Vite framework is a _prerequisite_, not a preference. | [vitest-addon docs](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)                                          |

### Placement (monorepo)

- **Don't put Storybook in `packages/ui`** — it _"blurs the boundary between
  application and library package."_ Use a **dedicated app**; **co-locate stories**
  next to components and glob into the package
  (`../../packages/ui/src/**/*.stories.*`). Rename the build script to
  **`build:storybook`**, cache `storybook-static/**`, and **exclude `*.stories.*`
  from the app's build inputs** so story edits don't bust the app cache.
  ([Turborepo Storybook guide](https://turborepo.dev/docs/guides/tools/storybook))
- The Vercel design-system template uses `apps/docs` for this — but it's
  npm-publish-oriented (tsup + Changesets), the opposite of our source-only private
  package, so it's a **placement precedent, not a drop-in architecture**.

### Component-library structure — shadcn vs custom (done 2026-08-01)

To keep the library legible **before** stories land next to components, the ~51
vendored shadcn primitives were moved from the flat `packages/ui/src/components/`
into a dedicated **`components/shadcn/`** subfolder; **custom / composed components
go at the `components/` top level** from now on.

**Why:**

- **Clear vendored-vs-custom split** — you instantly know what is CLI-regenerated
  (don't hand-edit) versus authored in-house.
- **Avoids a Storybook mess** — co-located `*.stories.tsx` sit beside the
  components they document. Keeping vendored primitives in their own folder stops
  the flat directory from becoming a wall of mixed source + story files, and makes
  it natural to story **custom components first** (the vendored primitives are
  already documented upstream by shadcn).

**What it touched (commit `67cddab`):**

- Moved the 51 primitives into `src/components/shadcn/`.
- Rewrote every cross-import and app consumer to `@workspace/ui/components/shadcn/*`.
  **Required** — the `exports` wildcard resolves by _exact path_, so a moved file
  must have its import path updated or the build breaks.
- Updated the shadcn CLI **`ui` alias** in **both** `components.json`
  (`@workspace/ui/components` → `@workspace/ui/components/shadcn`) so a future
  `npx shadcn add <x>` lands the new primitive **in `shadcn/`, not the root
  `components/`**. This is CLI-only config — **no runtime/build impact** — purely to
  keep new primitives in the right folder going forward.
- **No change needed** to the package `exports` wildcard (`./components/*` already
  resolves the nested path) or Tailwind's recursive `@source "../**/*.{ts,tsx}"`.
- Verified: `format`, `lint`, `typecheck`, `build` all pass.

### The Vite concern — resolved (dev-only, zero app-bundle impact)

Your question: _"aren't we adding Vite just for Storybook, and won't it bloat the
bundle?"_ **No.**

- Storybook builds to a **fully static site**; Vite is _Storybook's_ builder, not
  the app's. `apps/web` builds with **Turbopack**. Vite is **never in the app's
  runtime dependency graph** → **zero production-bundle impact**, now or later.
- This is exactly the [AGENTS.md] dependency-weight rule: _"Dev tooling (devDeps)
  never ships — weigh it on maintenance + supply-chain, not size."_
- It's the **lighter** choice anyway: the alternative builder is Webpack 5 + Babel.
  And Vite is **required** for `addon-vitest`. Turbopack (app) + Vite (Storybook)
  coexisting is normal.
  ([publish docs](https://storybook.js.org/docs/sharing/publish-storybook), [vitest-addon docs](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon))

### Deployment for a private product

| Host                                   | Private access                               | Verdict                                                 |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| **GitHub Pages**                       | Public-only (free/standard)                  | ❌ Disqualified — would leak proprietary components     |
| **Chromatic hosting**                  | Private URL, auto-synced to repo permissions | ✅ Lowest-effort — _if_ compliance accepts its cloud    |
| **Vercel / Netlify / Cloudflare**      | Their password/SSO (**paid**)                | ✅ Keeps it off Chromatic's cloud; we own access config |
| **Self-host / S3 + policy / internal** | Full control                                 | ✅ Max control, most ops                                |

**Decision:** deferred to deploy time (Phase 4). **Never GitHub Pages** for this repo.

### Chromatic (for the Phase-3 decision later)

SOC 2 Type 2, AES-256 at rest, **does not access source code**, **private repo →
private Storybook** by default, SSO/SAML + SCIM (Enterprise). **TurboSnap**
snapshots only changed stories (cost control). ⚠️ But the built Storybook +
snapshots live **on Chromatic's cloud** (no on-prem), and **only SOC 2** is
attested — **needs a compliance sign-off** before adoption.
([security](https://www.chromatic.com/security), [access](https://www.chromatic.com/docs/access/))

### Alternatives — rejected

Ladle (React-only, ~6.7× faster cold start, leaner) and Histoire (Vue/Svelte) are
lighter, but **lack a11y testing, visual regression, Chromatic, Figma, and the
addon ecosystem** — the exact things driving this adoption. Storybook wins for a
design system.
([comparison](https://www.pkgpulse.com/guides/storybook-8-vs-ladle-vs-histoire-2026))

## Critiques & counter-arguments (weighed, not ignored)

- **Dependency weight** — Storybook adds a **large but dev-only** footprint (order
  of dozens of transitive packages; SB10's ESM-only switch trimmed ~29%). Justified
  by the component-library use case; **quantify empirically at Phase 1**
  (`pnpm why` / install-size diff) — this number was _not_ verified in R&D.
- **RSC experimental** — with heavy React 19 Server Components, **only pure
  client/presentational components are storyable now**. Phase 1 covers those;
  Server-Component-only files wait.
- **Windows/pnpm frictions** — a `react-remove-scroll` module bug and monorepo
  type-resolution issues were reported against `nextjs-vite`; this repo is Windows +
  pnpm, so treat Phase 1 as spike-then-verify.
- **"Is it over-engineering now?"** — mitigated by _phasing_: local Storybook first;
  testing + Chromatic only when they earn their weight.

## Best practices / enterprise standards to follow

- **CSF3** stories, **co-located** with components; **autodocs** for prop tables.
- **`@storybook/addon-a11y`** (axe) in CI — the real a11y gap noted in
  [0014](0014-base-ui-adoption.md).
- **`@storybook/addon-vitest`** for interaction/component tests (Vite prerequisite).
- Light/dark **theming** in the preview; **MSW** for any data-driven stories.
- Turbo-cached `build:storybook`; SHA-pinned actions if a Storybook CI job is added
  (per [0009](0009-github-automation-and-governance.md)).
- Storybook **complements** (does not duplicate) the existing lint/typecheck/build
  gate — it adds isolation, docs, and visual/a11y coverage.

## Phased adoption plan

- **Phase 0 — Prep.** Tighten `engines.node` → `>=20.19`; land this ADR.
- **Phase 1 — Local Storybook.** `apps/storybook` on `@storybook/nextjs-vite`;
  Tailwind v4 + light/dark theme; consume `@workspace/ui`; co-located stories for
  **client/presentational** components; Turbo-cached `build:storybook`. Verify on
  Windows. Record the real dependency-weight number.
- **Phase 2 — Quality.** `addon-a11y` + `addon-vitest` interaction tests.
- **Phase 3 — Visual regression.** _After compliance sign-off_ → Chromatic +
  TurboSnap in CI (or a self-hosted `build-storybook` + open-source visual-diff).
- **Phase 4 — Publish.** Living docs behind access control (Chromatic private URL
  **or** Vercel/Netlify-behind-SSO — decided then).

## Risks & open questions

- Real dependency/CI cost (unquantified — measure at Phase 1).
- Which of the 51 components are storyable now vs RSC-blocked.
- Chromatic's SOC-2-only, cloud-hosted model vs a self-hosted alternative — the
  Phase-3/4 compliance call.
- ✅ _Resolved (Phase 1):_ Tailwind v4 + `nextjs-vite` needs the
  **`@tailwindcss/vite`** plugin (Storybook's auto PostCSS handling was **not**
  enough) — see Implementation notes. Light/dark preview switching is still TODO.

## Consequences

- A phased, low-risk path that respects the minimal/evidence-backed ethos: value
  first (local Storybook), heavier pieces (visual regression, hosting) only when
  justified.
- Node engines tighten to `>=20.19` (a Storybook requirement).
- Nothing is installed until Phase 1 is approved after this ADR. _(Phase 0-1 has
  since been executed — see Implementation notes below.)_

## Implementation notes — Phase 0-1 (done, 2026-08-01)

Executed and verified green (typecheck + lint + build + `storybook build`):

- **App:** dedicated `apps/storybook`, scaffolded via `create storybook` →
  Storybook **10.5** on **`@storybook/nextjs-vite`**; `engines.node` → `>=20.19`.
- **Stories:** co-located in `packages/ui` (glob → `packages/ui/src/**/*.stories.*`).
- **Turbo:** `build:storybook` caches `storybook-static/`; `*.stories.*`/`*.mdx`
  excluded from the app `build` inputs so story edits don't bust the app cache.
- **Telemetry:** disabled (`core.disableTelemetry`).

**Key finding — Tailwind v4 wiring (resolves an open question).** Storybook's
automatic PostCSS handling did **not** compile Tailwind v4: `@import "tailwindcss"`
and `tw-animate-css`'s `@utility`/`@theme` reached LightningCSS **uncompiled** →
components rendered **unstyled** with "Unknown at rule" warnings. Fix: add the
official **`@tailwindcss/vite`** plugin via `viteFinal` in `.storybook/main.ts`
(version aligned through the pnpm catalog). This is the required Tailwind-v4-on-Vite
path.

**Story conventions (audited against the official Storybook docs):** CSF3 with
`satisfies Meta` / `StoryObj`; **args-driven** with `onClick: fn()` for actions;
**manual `argTypes` (`select`)** for CVA `variant`/`size` (auto-inference can't read
CVA), with the option arrays `satisfies`-checked against the component's prop types
so they can't silently drift; a `Default` Controls playground + `Variants`/`Sizes`
gallery stories.

**Still retained (trim pending):** the full `create storybook` stack —
`@storybook/addon-vitest` + `vitest` + `playwright`, `@chromatic-com/storybook`,
`@storybook/addon-mcp`. Real footprint (lockfile grew ~90 KB; a ~150 MB Playwright
browser via the vitest addon). The **trim-to-Phase-1-essentials decision is still
open** (Phase 2/3 pieces).

## Sources

Storybook: [migration guide](https://storybook.js.org/docs/releases/migration-guide),
[SB10 blog](https://storybook.js.org/blog/storybook-10/),
[nextjs-vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite),
[vitest-addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon),
[publish](https://storybook.js.org/docs/sharing/publish-storybook) ·
Turborepo: [Storybook guide](https://turborepo.dev/docs/guides/tools/storybook) ·
Chromatic: [security](https://www.chromatic.com/security),
[access](https://www.chromatic.com/docs/access/) ·
Alternatives: [comparison](https://www.pkgpulse.com/guides/storybook-8-vs-ladle-vs-histoire-2026)
