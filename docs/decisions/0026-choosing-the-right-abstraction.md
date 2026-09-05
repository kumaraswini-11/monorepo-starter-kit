# 0026. Choosing the right abstraction — shape & API of reusable code

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

Building one small piece of UI — the account-menu avatar — surfaced a question that
recurs on almost every reusable thing we will ever write, and that costs real time each
time it is re-argued: given a candidate for reuse, **(a) do we abstract it at all, (b)
where does it live, and (c) — most importantly — _what shape_ should the abstraction
take** so it is reusable without becoming rigid, and DRY without becoming a wrong,
costly abstraction?

This is high-leverage and hard to reverse: the answer shapes package boundaries, folder
structure, component APIs, and the thought process across the template **and every future
app**. So the reasoning — including the disagreements and how they resolved — is captured
here as policy, not left implicit.

**Scope split with [0016](0016-shared-code-and-package-boundaries.md).** 0016 answers
**_where_** shared code lives (placement, the atomic-design lens, package boundaries,
client/server split, ports & adapters). **This ADR answers _what shape_** the abstraction
takes — its inputs, its API, and whether it should exist at all. The two are complementary:
decide the shape here, then place it per 0016. Methodology (how we research and decide) is
[0001](0001-decision-making-methodology.md).

## The recurring question & the critiques interrogated

The avatar debate is the concrete instance; each point below is the general lesson. All
five tensions are _real_ — the framework is how they resolve, not which one "wins".

- **"shadcn already ships `Avatar`. Wrapping it again is over-engineering."** — Valid, and
  correct _for a pass-through_. A wrapper that only renames a primitive is indirection with
  no payoff (the documented "anemic wrapper" failure mode). The skepticism is right until the
  wrapper earns its keep.
- **"We _know_ avatars recur — waiting for the 3rd use is foolish."** — Also valid. The rule
  of three is a hedge against **uncertainty**, not a law. When you genuinely know a thing is
  generic _and_ know its shape, waiting manufactures duplication. Foresight is a legitimate
  input. (The repo already says proven-generic UI goes to `@workspace/ui` **from the start**,
  0016.)
- **"It is not only a _user_ avatar — companies, customers, teams have them too."** — The key
  insight. A `UserAvatar` invites `CompanyAvatar`, `CustomerAvatar` … each re-implementing the
  same image-or-initials logic. That per-entity fan-out **is** the duplication we were trying
  to avoid.
- **"If the initials logic is baked into the component, I lose the free hand later (1 initial,
  3, an icon)."** — Valid concern about rigidity. A fixed policy with no way out is a smell.
- **"But if every call site computes the initials, they drift."** — Observed live: two call
  sites two lines apart rendered `fallback={user.name}` ("Dev User") vs
  `fallback={getInitials(user.name)}` ("DU"). Duplicated derivation drifts. This is Sandi
  Metz's point in miniature.

The last two look like a flexibility-vs-consistency dilemma. They are not — see principle 4.

## Decision — the framework

Six principles. They are ordered as you would actually apply them.

### 1. Wrap only to capture a _decision_, never to rename

The discriminating test: **if you deleted the wrapper, would any knowledge be lost?**

- **No** (callers would write the same thing) → it is a pass-through → **do not build it**.
- **Yes** (callers would each have to re-derive the same logic) → it is a real abstraction →
  build it.

A wrapper's job is to hold a decision (a derivation, a default, a policy) in **one** place.
"We have our own component" is not a reason; "the initials rule lives here once" is.

### 2. Abstract on confidence, not on a fixed count

The rule of three guards against committing to the **wrong shape** before you understand the
pattern. So the real bar is **generic + known shape**, not "used 3×":

- Genuinely generic **and** shape is well-understood (industry-settled) → abstract **now**.
- Shape still uncertain → wait, duplicate meanwhile (duplication is cheaper than the wrong
  abstraction).

Foresight counts. An avatar-with-fallback is a near-universal, shape-settled molecule; it
clears the bar on day one.

### 3. Prefer generic inputs over domain models — no per-entity wrappers

A shared composite takes the **minimal generic input** it needs (`name`, `src`), **not** a
domain object (`user`). Generic input is what lets one component serve every entity — user,
company, customer, team — so there is **no** `UserAvatar` / `CompanyAvatar` split to
duplicate the logic.

The only genuinely per-entity bit — **which field maps to the generic input**
(`user.name || user.email`, `company.legalName`, …) — is a one-liner and it _legitimately
differs per entity_, so it stays **at the call site**. Do not build a wrapper to hold it:
centralizing a trivial, per-entity mapping buys nothing and forces one wrapper per entity
(the very fan-out of principle-3's anti-pattern).

> Corollary: this is why "derive initials from a name" is **not** domain logic — it is generic
> _string_ logic (`getInitials`, [0016](0016-shared-code-and-package-boundaries.md)). Mislabeling
> generic logic as domain-specific is what pushes you toward per-entity wrappers. Ask: _would
> this identical code serve a different entity?_ If yes, it is generic — hoist it, don't fork it.

### 4. The right abstraction = sensible default **+** a single escape hatch

This dissolves flexibility-vs-consistency instead of trading between them:

- **Default** — bake the common policy in (initials derived from `name`). Callers get
  consistency for free; nothing is re-implemented per call site, so nothing drifts.
- **Escape hatch** — expose **one universal override** (a `fallback` **node**) that absorbs
  **every** custom case — 1 initial, 3, an icon, anything — **without adding props**.

Result: consistent by default, fully open when needed, and **no prop-explosion** (no
`maxInitials`, `initialsFn`, `showIcon` … accreting over time — the way wrappers rot). The
component owns the _mechanism_ (image-or-fallback) and a _default policy_; the escape hatch
hands policy back to the caller **only when they opt in**.

Rejected alternatives:

- **Pure escape hatch, no default** (caller always passes `fallback`) — the MUI/Radix model.
  Maximizes flexibility but re-introduces per-call-site derivation → duplication + drift (the
  observed bug). Optimizes the rare case at the expense of the common one.
- **Default with no escape hatch** — rigid; the caller fights the component the first time they
  need something else.

The chosen shape is the Chakra model (`name` → initials, with an override), and it also makes
a global policy change (e.g. 2 → 1 initial) a **one-place** edit rather than a call-site sweep.

### 5. Placement tiers & the promotion path (defer to [0016](0016-shared-code-and-package-boundaries.md))

Shape decided, place by **domain-boundedness**, not by atomic level alone:

| What                                                                 | Home                                                                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain-free **primitive** (`Avatar`, `AvatarFallback`)               | `@workspace/ui`                                                                                                                                         |
| Domain-free **composite** with generic inputs (`AvatarWithFallback`) | `@workspace/ui`, **from the start**                                                                                                                     |
| **Domain-bound** code (knows the model / the "which-field" mapping)  | the **call site** if trivial; the **app** if it is a real component; a shared **domain package** (never `@workspace/ui`) once a **2nd app** consumes it |

Two hard rules: **never lock domain knowledge into `@workspace/ui`** (it must stay reusable
across products and a future separate backend, [0017](0017-backend-architecture-and-migration.md)),
and **never scatter a generic primitive into a feature folder**. A domain component that will
later cross apps stays in the app **now** and is **promoted** to a shared domain package when
the second consumer actually exists — a cheap, non-breaking move **precisely because** it is a
self-contained unit. Building the unit is what keeps the promotion path open; inlining the
logic everywhere is what closes it.

### 6. Make the escape hatch discoverable

Document the override (a JSDoc `@example`, a Storybook story) so the "free hand" is
first-class and the abstraction is not re-litigated by the next reader. An undocumented escape
hatch reads as a missing feature.

## Worked example — the avatar

- **`@workspace/ui/components/avatar/avatar-with-fallback.tsx`** — `AvatarWithFallback` takes
  `name` / `src` / `alt` / `fallback`; derives initials from `name` via the generic
  `getInitials`; `fallback` (a node) overrides for any custom case. Entity-agnostic; domain-free.
- **No `UserAvatar`** (and by extension no `CompanyAvatar` / `CustomerAvatar`). The account menu
  does `<AvatarWithFallback name={user.name || user.email} src={user.image} alt="" />` — the
  `name || email` mapping (this app is email-first, so name-less users are normal) is the only
  per-entity bit, and it lives at the call site.
- **Before → after:** two call sites had drifted (`user.name` vs `getInitials(user.name)`);
  moving the rule into the component made the drift structurally impossible while keeping the
  `fallback` override for the day a non-initials fallback is needed.

## Anti-patterns this ADR rejects

- **Per-entity wrappers** (`UserAvatar`, `CompanyAvatar`, …) around generic logic — fan-out
  duplication.
- **Pass-through / anemic wrappers** that only rename a primitive — indirection, no decision
  captured.
- **Pure escape hatch** that forces every caller to re-derive the default — duplication + drift.
- **Prop-explosion** (`maxInitials`, `initialsFn`, per-case booleans) instead of one node
  escape hatch — the slow rot of a wrapper API.
- **Domain leakage into `@workspace/ui`** — baking a `{ name, email, image }` user shape into the
  design system, breaking reuse for the next product/app.

## Consequences

- One component per generic concept, shared across apps **and** entities; consistent by default,
  flexible on demand, with domain knowledge kept at the edges.
- A **repeatable test** for "should this be abstracted, and in what shape?", so the decision
  stops eating time and stops being re-argued.
- Cost: a little thought per abstraction (this framework), and occasional escape-hatch verbosity
  at call sites that genuinely deviate — an acceptable trade for eliminating drift and per-entity
  fan-out.

## Revisit triggers

- A generic composite in `@workspace/ui` starts sprouting per-case boolean/props → its policy is
  no longer "one default + one escape hatch"; reconsider the API (or split the concept).
- A domain composite gains a **2nd app** consumer → promote it from the app to a shared **domain**
  package (not `@workspace/ui`), per principle 5.
- A "generic" input turns out to encode one entity's assumptions → it was domain-bound; move the
  assumption back to the call site.

## Sources

- Premature abstraction / duplication vs the wrong abstraction — Sandi Metz, "The Wrong
  Abstraction" <https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction>; Rule of Three —
  <https://understandlegacycode.com/blog/refactoring-rule-of-three/>; Kent C. Dodds, "AHA
  Programming" <https://kentcdodds.com/blog/aha-programming>.
- Atomic Design as a lens, and technology-agnostic (domain-free) design systems — Brad Frost,
  "Atomic Web Design" <https://bradfrost.com/blog/post/atomic-web-design/> & "Managing
  technology-agnostic design systems"
  <https://bradfrost.com/blog/post/managing-technology-agnostic-design-systems/>; over-abstraction
  caution <https://dev.to/kevinchar93/proceed-with-caution-atomic-designs-impact-on-your-thought-process-2kc8>.
- Wrapping component-library primitives — pros (consistency, one choke-point) and the anemic-wrapper
  pitfall — Tim Holzherr, "Should you wrap your UI Component Library?"
  <https://medium.com/@TimHolzherr/should-you-wrap-your-ui-component-library-42dfc41df828>.
- The default-plus-override API precedent — Chakra UI `Avatar` (`name` → initials) vs MUI / Radix
  Themes (caller supplies the fallback): <https://www.chakra-ui.com/docs/components/avatar>,
  <https://mui.com/material-ui/react-avatar/>, <https://www.radix-ui.com/themes/docs/components/avatar>.

See [0001](0001-decision-making-methodology.md) (decision methodology),
[0016](0016-shared-code-and-package-boundaries.md) (**where** shared code lives — placement,
package boundaries, the `getInitials` util), and
[0017](0017-backend-architecture-and-migration.md) (why `@workspace/ui` must stay domain-free).
