# 0029. Date & time handling — native `Intl` for formatting; date-fns (already present) for manipulation

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

Building the notifications UI ([0028](0028-app-code-feature-architecture.md)) needed relative
timestamps ("3 minutes ago", "yesterday"). That raised the foundational question — this is a
**template**, so decide for scale, not for one component: **how does this monorepo handle date/time,
and do we adopt a date library (date-fns / dayjs / luxon) now?**

Guiding rule (as with [0016](0016-shared-code-and-package-boundaries.md)): decide at scale and for
the future. Two principles pull here and must not be conflated:

- **Build our reusable code now, don't defer** (template plug-and-play) — applies to _our_ helpers.
- **Justify every third-party dependency** (AGENTS.md · supply-chain cooldown · client-bundle
  weight) — applies to _libraries_. "Build our foundation now" is **not** a licence to pre-add deps.

## How we decided

Evaluated the platform **`Intl`** family + `Date` against **date-fns**, **dayjs**, **luxon**, and
the emerging native **`Temporal`** (TC39), for our real need (formatting/display, esp. relative
time) versus speculative needs (parsing, arithmetic, timezone math). Methodology per
[0001](0001-decision-making-methodology.md). Sources at the end.

### What's already in the tree (this shaped the decision)

**`date-fns@^4` is already a dependency of `packages/ui`** — as **`react-day-picker`'s** required
engine for the `Calendar` component (they sit together in `packages/ui/package.json`; `@date-fns/tz`
is pulled alongside). **Our own code imports date-fns nowhere** — it is the picker's engine, not a
date strategy we chose, and it is scoped to `packages/ui` (neither `apps/web` nor `@workspace/utils`
declares it). Consequence: when we _do_ need date manipulation, date-fns is the obvious default —
it's already paid for, so **no dayjs/Temporal bake-off** is needed.

Placement note (a _consequence_, not a reason): if a consumer uses date-fns it imports it directly
and declares it; the native `Intl` display helpers live in `@workspace/utils/date`. This is just
where each naturally sits — it is **not** an argument for `Intl` (a date-fns helper simply wouldn't
go in utils either way). The choice below rests only on client-bundle weight, i18n, and output.

## Decision

**Date/time _display_ is done with the native `Intl` APIs, wrapped in `@workspace/utils/date`
(pure, isomorphic, zero-dependency). No third-party date library is added now.**

- The first helper is **`formatRelativeTime(value, { now?, locale? })`** — built on
  `Intl.RelativeTimeFormat` (`numeric: "auto"`), accepts an ISO string / epoch-ms / `Date`, scales
  seconds → years, returns `""` for invalid input. It lives in `@workspace/utils/date` so every app
  and package shares one implementation (the template-first rule — build the reusable thing now,
  [[template-first-abstractions-feedback]]).
- Further display needs get further small wrappers **in the same file**, still zero-dep (see the
  capability map below) — e.g. `formatDate`, `formatDateRange`, `formatTime` over
  `Intl.DateTimeFormat`.

### Why native `Intl` over a library (for formatting)

|               | Native `Intl` (chosen)                             | date-fns `formatDistanceToNow` (rejected here)    |
| ------------- | -------------------------------------------------- | ------------------------------------------------- |
| Dependency    | **Zero** — built into Node ≥ 24 + every browser    | already in the tree, but a direct consumer dep    |
| Client bundle | **0 KB**                                           | non-zero even tree-shaken (fn + helpers + locale) |
| i18n          | **Native** — pass a `locale`, correct plurals free | must import & wire each `date-fns/locale/*`       |
| Output        | "3 minutes ago", **"yesterday"**, "in 2 days"      | "about 2 hours", "less than a minute" (approx.)   |
| Call site     | `formatRelativeTime(x)` — one line                 | `formatDistanceToNow(new Date(x), { addSuffix })` |

For relative time the library is **not** easier, and it is heavier, needs extra i18n wiring, and
gives more approximate output. Adding a dependency to replace a native API that does the job better
is exactly what the dependency-weight rule forbids.

### What `Intl` covers (so we know the ceiling of "no library")

Native, locale- **and** timezone-aware, zero-dep:

- **`Intl.RelativeTimeFormat`** — relative time ("3 minutes ago", "yesterday", "in 2 days").
- **`Intl.DateTimeFormat`** — the workhorse for absolute dates/times: `dateStyle`/`timeStyle`
  (full/long/medium/short) **or** granular `year/month/day/weekday/hour/minute/second`, `hour12`,
  `timeZone`, `timeZoneName`, `era`; **`formatRange`/`formatRangeToParts`** for "Jan 1 – 5";
  **`formatToParts`** to assemble any custom layout.
- **`Intl.DurationFormat`** — "1 hr 30 min" (newer; present in Node ≥ 24 — verify per target).
- **`Intl.NumberFormat`** — numeric pieces when needed.

So essentially **all display/formatting variants are covered natively** — a library buys nothing
here.

### What `Intl` does NOT do (the real trigger for a library)

- **Parsing** arbitrary/custom string formats (`Intl` only formats). `new Date()` parses **ISO**
  reliably; other formats are not portable.
- **Arithmetic** — add/subtract, diff, start-of-day, business days.
- **Timezone math** beyond display (conversions, "same wall-clock in zone X").

We have **none** of these needs yet. When we do, **date-fns is the default** — it is already in the
tree (react-day-picker, above), tree-shakeable, immutable, and `@date-fns/tz` is already present for
timezone work — so there is no new dependency and no library bake-off. (Native **`Temporal`** is the
long-term successor and worth a look _if_ date-fns ever proves insufficient, but it needs a polyfill
today, so it is not the default now.)

### Why not just "date-fns for everything" (the consistency question)

The tempting move — since date-fns is already installed — is to use it for display too, for
one-library consistency. We don't, because the consistency that matters is **one tool per job,
documented**, not one library for all jobs:

| Job                                         | Tool                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| Display / formatting / **relative time**    | native **`Intl`** (in `@workspace/utils/date`, zero-dep) |
| **Calendar / date-picking**                 | **react-day-picker + date-fns** (already present)        |
| Date **arithmetic / parsing** (when needed) | **date-fns** (already present)                           |

That is exactly one display API and exactly one manipulation/calendar library — unambiguous and
non-duplicative. Using date-fns for display instead would (a) ship date-fns into the **client**
bundle for trivial text, (b) require importing/shipping per-locale bundles for i18n that `Intl` does
natively, and (c) give more approximate output — trading real bundle/i18n/quality for a
"single-library" tidiness that the table above already delivers where it counts. (This is _not_
about keeping utils zero-dep — a date-fns helper would live in the consumer, not utils; the choice
stands on the merits above.)

## Do's and don'ts

**Do**

- Format dates/times with `Intl`, wrapped in `@workspace/utils/date` (one helper per concern).
- Keep helpers pure, isomorphic, zero-dep ([0016](0016-shared-code-and-package-boundaries.md) utils rules).
- Pass a `locale` when output must be stable; store/transport timestamps as **ISO-8601 / epoch**.
- Render clock-dependent output (relative time) only where an SSR/hydration mismatch is impossible
  or acceptable (a client-mounted surface), or reconcile it deliberately.
- For date **arithmetic/parsing** when it arises, use **date-fns** (already present via
  react-day-picker), imported directly in the consumer/package that declares it.

**Don't**

- Don't add date-fns/dayjs/luxon just to format or show relative time.
- Don't hand-roll locale/plural logic that `Intl` already does.
- Don't rely on `new Date("<non-ISO>")` parsing — it's implementation-defined.
- Don't add a **new** date library — date-fns (already in the tree) is the sanctioned manipulation
  lib; only revisit via ADR (e.g. `Temporal`) if it proves insufficient.
- Don't ship date-fns into the **client** bundle just to format or show relative time — that's
  `Intl`'s job.

## Consequences

- Zero date dependency in the client bundle; i18n/timezone support for free; one shared home
  (`@workspace/utils/date`) for date logic.
- A small amount of our own code (thin `Intl` wrappers) instead of a library call — offset by no
  supply-chain surface and better, lighter output.
- A clear, recorded boundary: **display = native `Intl` now; manipulation = a future library ADR
  (Temporal vs date-fns)**, so the next person doesn't reflexively reach for date-fns.

## Revisit triggers

- We need date **arithmetic**, **parsing** of non-ISO formats, or **timezone math** → use the
  already-present **date-fns** (+ `@date-fns/tz`); no new ADR needed unless it proves insufficient,
  in which case evaluate native `Temporal` (+ polyfill).
- `Intl.DurationFormat` (or another `Intl` API) is needed but a target runtime lacks it → add a
  small guarded fallback, still no full library.

## Sources

- MDN — `Intl.RelativeTimeFormat`:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat>
- MDN — `Intl.DateTimeFormat` (options, `formatRange`, `formatToParts`):
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat>
- MDN — `Intl.DurationFormat`:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat>
- TC39 — `Temporal` proposal: <https://tc39.es/proposal-temporal/docs/>
- date-fns: <https://date-fns.org/> · dayjs: <https://day.js.org/> · luxon: <https://moment.github.io/luxon/>

See [0016](0016-shared-code-and-package-boundaries.md) (`@workspace/utils` rules — zero-dep,
isomorphic, one concern per module) and [0028](0028-app-code-feature-architecture.md) (the feature
that prompted this).
