# 0022. Shared-code organization — utilities & internal-package boundaries

- **Status:** Accepted
- **Date:** 2026-08-09

## Context

As the product grows we will write many reusable pieces: generic helpers (date /
string / number formatting, `Result` types, guards, retry/sleep), domain logic, UI
utilities, and shared types. The question raised before proceeding: **where does
reusable code live — one `utils` package, or something more structured?** This is a
foundational, hard-to-reverse layout decision, so it is settled now as policy.

Guiding rule (as with [0021](0021-env-and-secrets-management.md)): **decide at
scale** — assume many apps and a large helper surface, and pick the structure that
_stays healthy_ at that size rather than the one that is easiest today.

### How we decided

An internet-wide pass against the tools we actually use and the enterprise
literature: **Turborepo** official best-practices ("one purpose per package"),
**Nx**'s widely-cited "the shared library is a lie" critique, **next-forge** (Vercel's
production Next.js template) as a concrete reference layout, and the Next.js/React
**`server-only`** boundary for bundle safety. Sources at the end. The repo's own
baseline (`@workspace/ui` exposing `./lib/*`, `./hooks/*`, `./components/*`;
`@workspace/db|auth|email` as domain packages) was taken as the create-turbo/shadcn
starting point (methodology per [0005](0005-follow-shadcn-baseline.md)).

## Questions & critiques interrogated

- **"Isn't one `@workspace/utils` package the simple, obvious choice?"** — Only if it
  stays _focused_. The failure mode is a catch-all (see below).
- **"Nx says a shared library is an anti-pattern; Turborepo ships a `utils` package.
  Which is right?"** — They agree once you read closely (resolution below).
- **"Do generic helpers, domain helpers, and UI helpers all go together?"** — No; they
  have different owners, dependencies, and runtime environments.
- **"Can the client safely import our shared helpers?"** — Only isomorphic, pure ones.
  Server-only code in a shared package is a real leakage/bundle hazard.
- **"What stops a tidy package from rotting into a dumping ground?"** — Enforced
  boundaries + a bar for entry, not good intentions.

## The apparent contradiction, resolved

- **Nx — "The Shared Library is a Lie":** the #1 monorepo failure is a catch-all
  `shared/` / `utils/` folder (hundreds of files, no owner) that slows builds and
  couples everything. Organize by **domain vertical slice** + **library _type_**
  (feature / ui / data-access / util), and **enforce module boundaries in CI**.
- **Turborepo — "one purpose per package":** _explicitly_ recommends **not** a single
  `shared` package, but focused ones — `ui` (components), `utils` (**general logic**),
  `hooks` (React logic), `auth`, `database`, config. Its reference tree contains
  `packages/utils/`.

They do not conflict. The anti-pattern is a **catch-all** package mixing unrelated
concerns. A **focused** `utils` package holding _only_ pure, general-purpose logic is
Turborepo-sanctioned and is exactly Nx's "util library" type. **next-forge** confirms
the shape: many single-purpose `@repo/*` packages, each self-contained.

## Decision

Shared code is placed by **purpose and runtime**, one purpose per package. Nothing
goes into a catch-all.

### Where each kind of code lives

| Kind of code                                                                                                            | Home                                                                                                                      | Status                |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Business/domain logic (auth flows, data access, email)                                                                  | its **own domain package** (`auth`, `db`, `email`; future `payments`, `notifications`) — owns its logic **and** its types | ✅ exists             |
| UI utilities (`cn`, React hooks, components)                                                                            | `@workspace/ui` (`./lib/*`, `./hooks/*`, `./components/*`)                                                                | ✅ exists             |
| Pure, generic, framework-agnostic helpers (date/string/number/array, `Result`, guards, `assert`, slugify, retry, sleep) | a focused **`@workspace/utils`** ("general logic")                                                                        | ✅ created 2026-08-16 |
| Cross-cutting contract types used by ≥2 domains that can't own them                                                     | colocate with the owning domain first; a tiny `@workspace/types` **only** if genuinely shared                             | ⬜ defer              |
| Config (eslint, tsconfig, tailwind)                                                                                     | `@workspace/eslint-config`, `@workspace/typescript-config`                                                                | ✅ exists             |

### Component placement — atomic-design lens; `@workspace/ui` is the single design system

_Settled 2026-08-16, after building the auth UI (RHF form layer, password inputs, brand),
which forced the recurring question: where does a piece of UI live, and how reusable should
it be? Sources at the end._

**Use Atomic Design as a _lens_, not a folder taxonomy.** Categorize by atomic level to pick
the _home_, but keep **reusability-tier packages + feature folders** — never literal
`atoms/`/`molecules/`/`organisms/` directories (they cause endless "molecule or organism?"
debates and navigation bloat; the 2026 consensus is a hybrid: atomic thinking for the shared
library, **feature-based** grouping for app code).

| Atomic level            | Example                                                                                                                      | Home                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Atoms**               | shadcn `Button`, `Input`, `Field`, `Alert`                                                                                   | `@workspace/ui`                                   |
| **Molecules**           | `PasswordInput`, `PasswordStrength`, `FormTextField`, `FormPasswordField`, `Form`, `SubmitButton`, `FormError`, brand `Logo` | `@workspace/ui`                                   |
| **Organisms** (feature) | `SignInForm`, `SignUpForm`, `AuthHeader`                                                                                     | `apps/web/components/<feature>` (feature-grouped) |
| **Templates / Pages**   | the `/auth/*` routes                                                                                                         | `apps/web/app`                                    |

**`@workspace/ui` is the single source of truth for atoms + molecules** — presentational
_and_ form-bound. Reusable molecules go here **from the start**, not deferred to a
"2nd-consumer" (that bar is only for _uncertain_ abstractions and feature/domain code), and
they can get Storybook stories here alongside the atoms (the shadcn atoms have them;
stories for the just-promoted molecules are a tracked follow-up — see
[../future-improvements.md](../future-improvements.md)). Feature **organisms** (e.g. `SignInForm`,
which is auth-specific) stay in the app, grouped by feature.

**`react-hook-form` is a `@workspace/ui` dependency — deliberately.** The form molecules
(`Form`, `SubmitButton`, `FormError`, `FormTextField`/`FormPasswordField`,
`submitWithFormError` / `FormSubmitError`) bind to RHF, and that is the right call **for this
repo**: `@workspace/ui` is an **internal** design system (not published for arbitrary
consumers), and **RHF is standardized across every app**
([0025](0025-frontend-architecture-forms-data-state-routing.md)). Making the design system
"form-state-agnostic" would optimize for a consumer our own standing decision rules out. It is
also **shadcn's own pattern** (its `Form` ships in the component layer with RHF). RHF is
pinned in the **catalog**, so every app shares one version; tree-shaking keeps it out of
bundles that import only atoms.

> **Considered and rejected: a separate `@workspace/form` composition package.** The "keep
> the design system library-agnostic / bring-your-own-state" principle (Brad Frost;
> Piccalilli) is real, but it is strongest for a **published, cross-stack** design system —
> not an internal monorepo committed to one form library. Single source of truth + one
> Storybook + shadcn-alignment win here; the agnosticism it buys is theoretical for us.

**Brand → `@workspace/ui`.** `Logo`/`LogoIcon` + product name (`brand.ts`) live here as the
product's shared identity (so multiple apps share one brand). Trade-off: a different-brand
project overwrites them there — the accepted single identity concession in an otherwise
brand-agnostic library. (Revises
[0024](0024-ui-foundations-layout-responsiveness-accessibility.md) §6, which had placed brand
in the app.)

The guardrail still holds: **don't scatter** a generic primitive inside a feature folder
(hard to find/reuse), and **don't hoist** a feature-specific **organism** (e.g. `SignInForm`)
into `@workspace/ui`.

**Revisit trigger — the one scenario that reopens this.** If `@workspace/ui` ever must serve a
**web** consumer that does _not_ use react-hook-form (a different form library, or a
form-less context), split the RHF-bound molecules into a dedicated `@workspace/form` package
(depending on `ui` + RHF) so the core stays agnostic. Unlikely, given the standing RHF
decision. **React Native is a _different_ scenario, not this trigger:** RHF itself supports
React Native, but `@workspace/ui` is a **web / DOM** design system (shadcn + Base UI) — an RN
app cannot render these components and needs its **own** UI layer regardless, so the
RHF-in-`ui` choice does not block it. If RN ever lands, the shared piece is a separate RN
component package (and/or headless logic), not this one.

### `@workspace/utils` rules (so it never becomes the anti-pattern)

1. **Isomorphic & pure only** — identical on client and server. No Node-only (`fs`,
   server `crypto`) or browser-only (`window`, `document`) APIs, no I/O, no
   import-time side effects.
2. **`"sideEffects": false`** + **granular subpath exports** (`@workspace/utils/date`,
   `/string`, `/result`), **one module per concern** — the same per-topic discipline
   applied to `packages/db/queries/` ([0019](0019-data-layer-postgres-drizzle.md)). A
   client importing `formatDate` must not pull in the whole package.
3. **Dependency-light** — the client can import it, so keep it near-zero-dep; heavy
   deps go behind lazy `import()` or stay in a domain package.
4. **Rule of three / avoid premature abstraction** — a function earns a place only when
   it is (a) pure, (b) truly generic (not domain-specific), and (c) reused in ≥2
   places. Domain-specific helpers stay in their domain package. A wrong abstraction is
   costlier than duplication.
5. **Source-only** (no build step) — matches every other `@workspace/*` package.

> **Created 2026-08-16**, seeded with `firstName` (`@workspace/utils/string`) — the first
> genuinely-generic helper to clear the entry bar (extracted from `packages/auth`, which now
> consumes it). Zero runtime dependencies. Add further helpers per the rules above; one
> concern per module.

### Client / server / isomorphic — the bundle-safety boundary

Split shared code **three** ways, not two:

- **Isomorphic** → `@workspace/utils` (rules above).
- **Server-only** helpers (secrets, DB, `fs`, Node) → **never** in `@workspace/utils`;
  keep in the domain package's server context and guard with the **`server-only`**
  package, which throws at build if a client bundle imports it. Use **`client-only`**
  for the inverse.

This boundary is what prevents a "shared helper" from leaking secrets or Node code
into the browser bundle — it is the reason the isomorphic package is kept strictly
pure.

### Governance (what stops the rot)

- **Enforce boundaries in lint, not docs** — `eslint-plugin-boundaries` (or
  `import/no-restricted-imports`): apps may import packages but not each other;
  `@workspace/utils` imports **nothing** internal; no deep-reaching past a package's
  `exports` map. CI already fails on warnings ([0003](0003-hard-lint-gate.md)), so this
  becomes a hard gate.
- **Acyclic dependency direction:** `utils` (leaf) → domain packages → `ui` → apps.
- **One purpose per package**, documented; `@workspace/*` naming (existing convention).

## Non-goals / not now

- **Do not** create `@workspace/utils` speculatively or pre-fill it — create it when
  the first genuinely-generic, reused helper appears, then add helpers per the entry
  bar. This ADR is the _policy_; the package is created just-in-time.
- **Do not** add `@workspace/types` until a real cross-domain contract type exists —
  colocate types with their domain.
- No Nx-style tag taxonomy engine; the ESLint boundary rule is enough at this scale.

## Consequences

- A clear, boring answer to "where does this helper go?", enforced by lint rather than
  discipline — the catch-all failure mode is structurally prevented.
- Slightly more packages and a little more `exports`-map wiring; in exchange, clean
  tree-shaking, safe client/server separation, and granular Turbo caching.
- The naming default is **`@workspace/utils`** (Turborepo's own term; `core`/`lib` were
  rejected as vaguer). Revisit only if a clearer split emerges.

## Revisit triggers

- The first reusable generic helper lands → **create `@workspace/utils`** per the rules.
- A pure helper needs a heavy dependency → lazy-load it or relocate to a domain package.
- A contract type is shared by ≥2 domains that can't own it → introduce `@workspace/types`.
- Package count or coupling grows enough to want tag-based boundaries → evaluate a
  richer boundaries config.

## Sources

- Nx — "The Shared Library is a Lie" (catch-all anti-pattern; domain slices; library
  types; enforced boundaries) — <https://dev.to/abdelaaziz_ouakala/the-shared-library-is-a-lie-fixing-your-nx-monorepo-architecture-3mie>
- Turborepo — Creating an internal package / "one purpose per package" —
  <https://turborepo.com/docs/crafting-your-repository/creating-an-internal-package>
- Turborepo — Structuring a repository —
  <https://turborepo.com/docs/crafting-your-repository/structuring-a-repository>
- next-forge — production Turborepo/Next.js template layout —
  <https://github.com/vercel/next-forge>, <https://www.next-forge.com/docs/structure>
- `server-only` / `client-only` (keep server code out of client bundles) —
  <https://www.npmjs.com/package/server-only>,
  <https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment>
- Tree-shaking & `sideEffects` — <https://webpack.js.org/guides/tree-shaking/>
- Premature abstraction / rule of three — Sandi Metz, "The Wrong Abstraction"
  <https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction>; Kent C. Dodds, "AHA
  Programming" <https://kentcdodds.com/blog/aha-programming>
- Component placement § (agnostic design system + Atomic Design, added 2026-08-16) — Brad
  Frost, "Managing technology-agnostic design systems"
  <https://bradfrost.com/blog/post/managing-technology-agnostic-design-systems/> & "Atomic
  Design" <https://bradfrost.com/blog/post/atomic-web-design/>; Piccalilli,
  "Framework-agnostic design systems"
  <https://piccalil.li/blog/framework-agnostic-design-systems-part-1/>; Atomic-Design +
  Feature-Sliced hybrid / feature-based critique
  <https://www.codewithseb.com/blog/from-components-to-systems-scalable-frontend-with-atomiec-design>
- `eslint-plugin-boundaries` (module-boundary enforcement) —
  <https://github.com/javierbrea/eslint-plugin-boundaries>

See [0005](0005-follow-shadcn-baseline.md) (baseline methodology),
[0019](0019-data-layer-postgres-drizzle.md) (per-aggregate module discipline), and
[../future-improvements.md](../future-improvements.md).
