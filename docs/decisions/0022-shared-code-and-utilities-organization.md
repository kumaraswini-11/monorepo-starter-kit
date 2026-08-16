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

| Kind of code                                                                                                            | Home                                                                                                                      | Status                      |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Business/domain logic (auth flows, data access, email)                                                                  | its **own domain package** (`auth`, `db`, `email`; future `payments`, `notifications`) — owns its logic **and** its types | ✅ exists                   |
| UI utilities (`cn`, React hooks, components)                                                                            | `@workspace/ui` (`./lib/*`, `./hooks/*`, `./components/*`)                                                                | ✅ exists                   |
| Pure, generic, framework-agnostic helpers (date/string/number/array, `Result`, guards, `assert`, slugify, retry, sleep) | a focused **`@workspace/utils`** ("general logic")                                                                        | ⬜ create when first needed |
| Cross-cutting contract types used by ≥2 domains that can't own them                                                     | colocate with the owning domain first; a tiny `@workspace/types` **only** if genuinely shared                             | ⬜ defer                    |
| Config (eslint, tsconfig, tailwind)                                                                                     | `@workspace/eslint-config`, `@workspace/typescript-config`                                                                | ✅ exists                   |

### Component placement — app scope vs. `@workspace/ui`

The table's "UI components → `@workspace/ui`" row is the _cross-app_ destination, not a
blanket rule. Every component sits in one of three tiers:

- **App-specific** (a feature's screens / flows, brand identity, app wiring) → the app
  (`apps/*/components/*`). **Folder by concern** so _generic_ vs _scope_ is visible at a
  glance — e.g. the auth work keeps generic form infrastructure in `components/form/` and
  auth-only composition in `components/auth/`.
- **Truly generic + brand/domain-agnostic**, reused across **≥ 2 apps** → `@workspace/ui`.
  The promotion trigger is the **second consumer**, not "might be reused someday"
  (rule-of-three; a premature abstraction is costlier than duplication). Because the generic
  pieces are already isolated in their own folder, promotion is a cheap **folder-move**, not
  an untangling job — which is the whole point of foldering by scope _now_.
- **App / brand identity** (the `Logo`, product name) → the app
  ([0024](0024-ui-foundations-layout-responsiveness-accessibility.md) §6); `@workspace/ui`
  stays **brand-agnostic** so it is reusable across products. A dedicated `@workspace/brand`
  is the home only if multiple apps of the **same** product must share one identity.

The guardrail cuts both ways: **don't scatter** a generic primitive inside a feature folder
(hard to find and promote), and **don't hoist** an app-specific or single-consumer component
into `@workspace/ui` (freezes an API before a 2nd use and pollutes the shared lib). Applied
example: `PasswordInput` / `PasswordStrength` are generic → `components/form/`, not
`components/auth/`; the React Hook Form layer is generic but single-consumer → stays
app-level until a 2nd app, cleanly promotable ([0025 §2](0025-frontend-architecture-forms-data-state-routing.md)).

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
- `eslint-plugin-boundaries` (module-boundary enforcement) —
  <https://github.com/javierbrea/eslint-plugin-boundaries>

See [0005](0005-follow-shadcn-baseline.md) (baseline methodology),
[0019](0019-data-layer-postgres-drizzle.md) (per-aggregate module discipline), and
[../future-improvements.md](../future-improvements.md).
