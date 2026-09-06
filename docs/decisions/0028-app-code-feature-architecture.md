# 0028. App-code organization — feature-first architecture & sub-feature nesting

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

[0016](0016-shared-code-and-package-boundaries.md) settled where **shared** code
lives (packages) and declared the app-code half of the answer — "**feature-based**
grouping for app code" — but never made it concrete. The implementation drifted to
the opposite: **type-first with feature sub-folders** (`components/<feature>/`,
`lib/<feature>/`), which scatters a single feature across many locations. Auth today
lives in five places (`app/auth/*`, `app/api/auth/*`, `components/auth/*` — 13 files,
`lib/auth/*`, `lib/auth-client.ts`, `lib/session.ts`, `lib/validation.ts`);
notifications in two (`components/notifications/`, `lib/notifications/`). That is the
exact failure mode this ADR fixes.

This is a **direction-setting, hard-to-reverse layout decision** — it defines the
file/folder shape of the whole app — so it is settled now, as policy, before more
features land. Guiding rule (as with [0016](0016-shared-code-and-package-boundaries.md)):
**decide at scale and for the future, not for today.** This is a **template**: the
structure must make a feature **plug-and-play** — liftable into another app with
minimal rework — and it must stay legible to **both humans and AI agents** (predictable
paths, a single public-API file per feature to read, colocation so a capability's whole
surface is in one place — fewer files to open, fewer tokens to spend locating it).

### How we decided

A primary-source pass (methodology per [0001](0001-decision-making-methodology.md)):
**Feature-Sliced Design** (feature-sliced.design — layers/slices/segments, the
one-directional import rule, per-slice public API, and its explicit stance on nested
slices), **Next.js** official project-structure docs (colocation, private folders,
route groups, "split by feature or route", "unopinionated"), **Nx** project-dependency
rules + `enforce-module-boundaries` (the feature/ui/data-access/util library-type DAG),
**Turborepo** "one purpose per package", **next-forge** (Vercel's production template —
self-contained packages), and Robert C. Martin's **Screaming Architecture**. Sources at
the end.

## Questions & critiques interrogated

- **"Feature-based vs type-based — which scales?"** — Feature-based. Type-first
  (`components/hooks/lib` at the top) is fine tiny and rots at size: one change touches
  many folders, related code is far apart, and the top level screams "a React app," not
  the product. Feature-first colocates a capability, so changes are local, deletion is
  clean, and the tree is self-documenting. Next's docs list "split by feature or route"
  as a first-class strategy.
- **"Should we adopt Feature-Sliced Design literally?"** — **No.** Borrow its three
  best ideas (segment vocabulary, per-slice public API, one-way import rule); reject its
  **layer taxonomy** (`app`/`pages`/`widgets`/`features`/`entities`/`shared`). This repo
  has _already_ externalized FSD's lower layers into packages (`@workspace/ui` = FSD
  `shared/ui`; `packages/{auth,db,email}` = FSD `entities`/domain), and FSD's `app`/`pages`
  layer names **collide with the Next App Router** — the official FSD-with-Next guide's fix
  is rename-to-`_app`/`_pages` + a re-export from every route. That double-indirection is
  the proof a _literal_ FSD fights an App-Router-native template.
- **"A feature with multiple sub-features — how do we nest?"** — Stay flat; cap nesting
  at one level; prefer siblings over nesting. FSD **forbids** a parent slice that owns
  code its child slices import. (Full rule below — this was the decisive question.)
- **"Where's the line vs Next's own `_components`/`_lib`?"** — Route-local & single-use →
  the route's private folder; reused-across-routes or a feature's own code → the feature
  module. Both are Next-blessed; the split removes ambiguity.
- **"Doesn't ADR 0016 ban barrels for tree-shaking?"** — For `@workspace/ui` (a
  published-shape shared package), yes, that stands. App features are route-code-split; a
  **thin, named** feature barrel is the right call there (and is what makes it agent- and
  reuse-friendly). Different context, different rule.

## Decision

**Feature-first app-code organization.** A feature's own code lives in one liftable
module, `apps/web/features/<feature>/`. `app/` stays a **thin routing/composition
layer**. Borrow FSD's segments + public-API + import-direction; **do not** adopt its
layer taxonomy or the Next re-export ceremony.

The single most important constraint for _this_ repo: **domain/data-access logic does
not move into `apps/web/features/*`.** Per [0017](0017-backend-architecture-and-migration.md)
the web tier stays thin so the future backend split is a transport swap. A feature module
in the app holds **UI + hooks + a thin transport seam + UI-facing contracts**; the heavy
domain logic stays in (or graduates to) a `@workspace/*` package that the feature _consumes_.

### The placement rule (memorize this)

> **Reused across routes, or a feature's own code → `apps/web/features/<feature>/`.**
> **Truly route-local and single-use → colocate in the route (`_components/`, `_lib/`).**
> **Generic / domain-free → down a layer:** `@workspace/ui` (UI), `@workspace/utils`
> (pure), or a domain package (`@workspace/{auth,db,email,…}`).

`features/` sits at the app root (not `src/features/`) — the repo has no `src/` and
`@/*` already maps to the app root, so `@/features/*` works with zero config and stays
consistent with `typedRoutes`.

### When is it a feature? (the classification test)

The placement rule says _where_ code goes once you've decided _what it is_. This is how
you decide what it is — the answer to "is this a feature, a sub-feature, or not a feature
at all?" Applied by trajectory + domain, not by today's line count (a feature can start as
one file), but **not** padded with speculative folders either ("not everything needs to be
a feature" — FSD).

**Test 1 — is it a feature at all?** A `features/<x>/` module is for a **product
capability** — a domain noun you or your users would name. It earns a module when it has
**(a) a domain noun** _and_ **(b) owns ≥2 of**: its own contract/types · its own
actions/data-access seam · its own route(s) · several components that collaborate. A lone
presentational component with no domain is **not** a feature. Where non-features go:

| It is…                                           | Home                                               | Why not a feature                       |
| ------------------------------------------------ | -------------------------------------------------- | --------------------------------------- |
| Presentational, reusable, no domain (a `Button`) | `@workspace/ui`                                    | no domain, no data                      |
| Pure / generic helper                            | `@workspace/utils`                                 | no UI, no domain                        |
| Route-local & single-use                         | the route's `_components`/`_lib`                   | one consumer, one place                 |
| Cross-cutting infra (theme provider, analytics)  | app-level infra (`features/theme` or `providers/`) | plumbing, not a domain                  |
| Domain/data logic that must survive the split    | a `@workspace/*` package                           | it lives deeper than the app (ADR 0017) |

**Test 2 — feature vs sub-feature (nesting)?** Ask: _could it be described, deleted, or
lifted on its own without touching the parent's logic, and does it own its own
types/actions/route?_

- **Yes → independent capability → sibling feature** (in a group folder that shares no code).
- **No → internal structure → a sub-folder inside a segment** (e.g. `features/settings/components/billing/`).

This is the same split as the sub-feature decision tree below, reduced to one question.

**Worked classification of the current app** (so the test is concrete):

| Module          | Verdict                                | Why                                                                                                                                  |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `notifications` | **feature**                            | domain noun + owns type, coming actions, coming `/notifications` route, bell→list→item                                               |
| `auth`          | **feature** (multi-part)               | domain noun + forms/steps + seam (`actions.ts`) + routes; one feature with internal `components/` structure, not nested sub-features |
| `app-shell`     | **feature module, composition widget** | no _domain_ of its own, but it is the composition root that wires the others (a "widget")                                            |
| `theme`         | **app-level infra**                    | a provider + menu, no domain — plumbing, not a product capability                                                                    |

> A feature classified by trajectory can legitimately **start as one file** (e.g.
> notifications today = a bell + a type). That is expected — classify by domain + where
> it's going, then let the segments (`hooks/`, `actions.ts`, a `/route`) appear as the
> capability actually grows. Do **not** pre-create empty segments.

### Per-feature layout (FSD segments, App-Router-adapted)

```
apps/web/features/<feature>/
├── components/        # feature UI (organisms)          — FSD "ui"
├── hooks/             # feature-local React state/logic — FSD "lib"/"model"
├── actions.ts         # the transport SEAM (ADR 0017)   — FSD "api"
├── types.ts           # feature-local UI contract       — FSD "model"
└── index.ts           # PUBLIC API — the only entry other features/routes import
```

Use **flat files** (`actions.ts`, `types.ts`) until a segment exceeds ~3 files, then
promote to a folder (`actions/`, `model/`). Small features stay flat — "not everything
needs to be a feature" (FSD). Keep `components/` (over FSD's `ui/`) for continuity with
the existing repo + shadcn vocabulary.

### Public-API / barrel convention

Each feature exposes **one `index.ts`** as its public API. Other features and routes
import **only** `@/features/<feature>` — never a deep path from _outside_ the feature.
**Named re-exports only — never `export *`** (FSD anti-pattern; breaks tree-shaking,
discoverability, and safe refactoring). Inside a feature use **relative** imports; across
features/routes use the `@/features/*` barrel. Keep the barrel **thin** and lean on route
code-splitting + `optimizePackageImports`. This barrel is deliberate and separate from
[0016](0016-shared-code-and-package-boundaries.md)'s barrel-free rule for `@workspace/ui`
— it is also what lets a human or an AI agent learn a feature's surface from **one file**
instead of grepping the tree.

### Cross-feature import rules (FSD low-coupling, adapted)

- A feature **must not** import another feature's internals. Sibling features are peers
  ("slices cannot use other slices on the same layer").
- Shared need → **move it down a layer**: generic UI → `@workspace/ui`; pure helper →
  `@workspace/utils`; shared domain logic/types → a domain package.
- The **only** composition roots — the one place allowed to import several features — are
  **`app-shell`** (the shell "widget") and **routes** (`app/**/page.tsx`).
- **Enforce in lint, not docs** ([0016](0016-shared-code-and-package-boundaries.md)
  §Governance): extend `@workspace/eslint-config`'s `no-restricted-imports` to allow
  `@/features/x` but ban `@/features/x/**` _from outside feature x_. A future
  `eslint-plugin-boundaries` config can encode the full type graph if the app grows.

### The sub-feature nesting rule (the decisive question)

**Default: stay flat. Cap nesting at one level. Prefer siblings over nesting.** This is
FSD's explicit stance and the right one. FSD (verbatim): "_Closely related slices can be
structurally grouped in a folder, but they should exercise the same isolation rules as
other slices — there should be no code sharing in that folder._" A group folder is fine
for tidiness; its members stay **independent slices** — no parent slice that owns code its
children import.

Decision tree for a feature with sub-features:

1. **Sub-parts that are just internal structure** (one big feature's UI naturally splits)
   → **sub-folders inside a segment**, not nested feature modules:
   `features/settings/components/{billing,profile}/`. **One feature, one public API,
   internal folders for organization.** This is the common, correct case.
2. **Sub-features that are genuinely independent capabilities** (own actions, own types,
   independently meaningful) → **split into sibling features**, optionally in a group
   folder that holds _no shared code_: `features/settings/{billing,profile}/` where each is
   a full, isolated feature with its own `index.ts` that **do not import each other**.
   Shared bits go down a layer.
3. **A sub-feature reused by a second app** → **graduate to a `@workspace/*` package**
   (below).

**Don't** build `features/<feature>/<sub-feature>/{ui,model,…}` where the sub-feature
imports the parent's shared internals — the nested-slice-with-code-sharing pattern FSD
forbids, and the thing that rots into coupling. Hierarchy in the **URL** is expressed by
`app/` route nesting + route groups; hierarchy in the **code** is expressed by flat
sibling features + composition, not deep folders.

### When a feature graduates to `packages/*`

Two triggers, both already established:

- **A second app consumes it** → promote to `@workspace/*`
  ([0026](0026-choosing-the-right-abstraction.md) revisit trigger; Nx's
  extract-on-second-consumer). Generic UI goes to `@workspace/ui` _from the start_
  ([0016](0016-shared-code-and-package-boundaries.md)); _uncertain_ app code waits for the
  2nd consumer.
- **It's domain/data-access logic that must survive the backend split** → it belongs in a
  framework-neutral domain package **now**, not in `apps/web/features/*`
  ([0017](0017-backend-architecture-and-migration.md)). ADR 0016's table already lists a
  future `notifications` domain package.

Division of labor: **`apps/web/features/<x>/` = presentation + hooks + thin transport
seam + UI contracts; `packages/<x>/` = domain logic, queries, durable contract types.**
The feature module _consumes_ the domain package, keeping the ADR 0017 split a transport swap.

### app-shell & theme

- **`app-shell`** is a **composition widget**, not a domain feature — it wires the shell
  chrome and pulls in other features' public entries. It is the one module allowed to
  import several features. (Kept under `features/app-shell/`.)
- **`theme`** is an **app-level cross-cutting concern** (provider + menu), no domain —
  treat as infrastructure. `features/theme/` is fine; be consistent.

### Worked example — notifications

```
apps/web/features/notifications/
├── components/  notification-bell.tsx  notification-list.tsx  notification-item.tsx
├── hooks/       use-notifications.ts          # optimistic read-state (today inline in the bell)
├── actions.ts                                 # markRead / markAllRead / fetch — the ADR 0017 seam
├── types.ts                                   # the `Notification` UI contract
└── index.ts     # export { NotificationBell, NotificationList }; export type { Notification }

apps/web/app/(app)/notifications/page.tsx      # future route → import { NotificationList } from "@/features/notifications"
```

The shell imports `NotificationBell` from `@/features/notifications` (not a deep path).
The permanent `Notification` type lives here now; on the backend split it moves to (or is
re-exported from) a `@workspace/notifications` package and `actions.ts` swaps its
transport — **no component change**, exactly as the current file's doc-comment
anticipates. A future `/notifications/settings` is **route nesting** in `app/`, backed by
a `components/settings/` sub-folder (UI structure) or a sibling
`features/notification-preferences/` (independent capability) — per the sub-feature rule.

### Worked example — auth (multi-part feature)

```
apps/web/features/auth/
├── components/  *-form.tsx  *-step.tsx  auth-header.tsx  auth-flow-provider.tsx
│               verify-email-banner.tsx  google-sign-in-button.tsx  (+ .test.tsx)
├── hooks/       use-sign-out.ts
├── actions.ts (+ .test.ts)                    # the seam: signIn/signUp/resetPassword…
├── lib/         auth-client.ts  session.ts    # transport + server session read (ADR 0017 swap points)
└── index.ts

apps/web/app/auth/**                           # routes stay thin; each composes a *-step
apps/web/app/api/auth/[...all]/route.ts        # transport mount stays in app/ (it's a route)
packages/auth/**                               # UNCHANGED — framework-neutral core (ADR 0011/0017)
```

Auth's many parts (forms, steps, header, provider, banner) are **one feature with
internal `components/` structure** — the case-1 pattern, _not_ nested sub-features. The
ADR 0017 four-layer seam is preserved and now **colocated**: forms → steps → `actions.ts`
→ `lib/auth-client.ts` → `packages/auth`. `lib/session.ts` (ADR 0017's "one file to
change" on a split) becomes an obvious swap point. Everything auth owns sits in one
liftable folder — the plug-and-play goal.

## Do's and don'ts

**Do**

- Put a feature's own code in `apps/web/features/<feature>/`; colocate UI, hooks, seam, contracts.
- Expose one thin `index.ts` public API per feature; **named** re-exports only.
- Import across features/routes via `@/features/<feature>`; relative imports inside a feature.
- Keep sub-features **flat** — internal segment sub-folders for structure, sibling features
  for independent capabilities.
- Keep domain/data-access logic in `@workspace/*` packages (ADR 0017); the feature's
  `actions.ts` is a thin seam over it.
- Use Next `_components`/`_lib` for genuinely route-local, single-use code.
- Enforce boundaries in ESLint, not docs.
- Let `app-shell`/routes be the only composition roots.

**Don't**

- Don't reintroduce top-level type folders (`components/`, `lib/`) as the primary axis for feature code.
- Don't nest a sub-feature that imports its parent's shared internals (FSD forbids it).
- Don't `export *` from a feature barrel.
- Don't import another feature's internals; push shared code down a layer.
- Don't move domain/DB logic into `apps/web/features/*` (breaks the ADR 0017 split).
- Don't add a barrel to `@workspace/ui` (ADR 0016's per-file exports stand).
- Don't adopt FSD's `app`/`pages` layer names or the `_app`/`_pages` re-export ceremony (fights Next 16).
- Don't over-slice: "not everything needs to be a feature."

## Consequences

- A clear, boring answer to "where does this feature code go?", enforced by lint — the
  scatter failure mode is structurally prevented.
- The tree **screams the product** (`features/{auth,notifications,…}`), not the framework.
- Each feature is a **self-contained, liftable unit** — the template plug-and-play goal —
  and the later graduation to a package (ADR 0026) becomes a cheap, non-breaking move.
- **Agent/token economy:** predictable `@/features/<x>` paths + a single public-API file
  per feature mean a human or agent locates a capability's whole surface by opening one
  folder / one `index.ts`, not by grepping across `components/`, `hooks/`, `lib/`.
- Cost: a mechanical migration (file moves + import-path updates, no logic change) and a
  mild feature-barrel tree-shaking/HMR consideration — mitigated by keeping barrels thin +
  named and relying on route code-splitting.

## Migration impact & incrementality

Fully **incremental and low-risk** — file moves + import-path updates, no logic changes;
`@/*`, `typedRoutes`, and the per-file `@workspace/ui` exports make churn mechanical and
the gate catches misses. Suggested order (smallest blast radius first): **notifications**
(proves the pattern; the files already document the seam) → **theme** (trivial) → **auth**
(largest payoff; preserves the ADR 0017 seam, colocated) → **app-shell** (last; it composes
the others) → **add the ESLint cross-feature boundary rule** → **docs** (this ADR + a note
in ADR 0016 that its "feature-based app code" half is now specified here; cross-link 0017 &
0026). `packages/*` are untouched. **Not started** — this ADR records the decision; the
migration is separate work.

## Non-goals / not now

- No `src/` directory — `features/` at the app root, consistent with `@/*`.
- No `eslint-plugin-boundaries` type-graph engine yet — the `no-restricted-imports` rule is
  enough at this scale (revisit if the graph grows, per ADR 0016).
- No premature `features/` folders — create one when a feature actually has its own code;
  don't scaffold empty modules.

## Revisit triggers

- A feature gains a second app consumer, or becomes domain/data-access that must survive
  the backend split → graduate it to `@workspace/*` (ADR 0026 / 0017).
- Cross-feature coupling appears in review → tighten the boundary lint / evaluate
  `eslint-plugin-boundaries`.
- A feature's segment exceeds ~3 files → promote the flat file to a folder.
- A genuinely hierarchical feature appears → apply the sub-feature decision tree (flat
  sub-folder vs sibling feature vs package).

## Sources

- Feature-Sliced Design — Overview (layers, slices, segments, import rule) —
  <https://feature-sliced.design/docs/get-started/overview>
- FSD — Layers ("not everything needs to be a feature"; layer definitions) —
  <https://feature-sliced.design/docs/reference/layers>
- FSD — Slices & Segments (segment list; **grouped slices share no code**; low-coupling rule) —
  <https://feature-sliced.design/docs/reference/slices-segments>
- FSD — Public API (index.ts contract; **no `export *`**) —
  <https://feature-sliced.design/docs/reference/public-api>
- FSD — Next.js guide (the `app`/`pages` conflict; `_app`/`_pages` rename + re-export ceremony) —
  <https://feature-sliced.design/docs/guides/tech/with-nextjs>
- Next.js — Project structure & organization (colocation, private folders, route groups,
  "split by feature or route", "unopinionated") —
  <https://nextjs.org/docs/app/getting-started/project-structure>
- Nx — Project dependency rules / library types (feature/ui/data-access/util) —
  <https://nx.dev/concepts/decisions/project-dependency-rules>
- Nx — enforce-module-boundaries (tags + type constraints) —
  <https://nx.dev/features/enforce-module-boundaries>
- next-forge — production template; self-contained packages —
  <https://www.next-forge.com/docs/structure>, <https://github.com/vercel/next-forge>
- Turborepo — Structuring a repository / one purpose per package —
  <https://turborepo.com/docs/crafting-your-repository/structuring-a-repository>
- Robert C. Martin — Screaming Architecture —
  <https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html>

See [0016](0016-shared-code-and-package-boundaries.md) (shared-code/package boundaries —
this specifies its "feature-based app code" half), [0017](0017-backend-architecture-and-migration.md)
(the transport seam colocated by this ADR), [0026](0026-choosing-the-right-abstraction.md)
(abstraction shape + promotion path), and [../future-improvements.md](../future-improvements.md).
