# 0038. Design-system usage linting — `@shadcn/lint` on consumers, contracts as the escape hatch

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

[0016](0016-shared-code-and-package-boundaries.md) and [0026](0026-choosing-the-right-abstraction.md)
define how the design system is meant to be used: a component exposes generic inputs, a sensible
default and one escape hatch; consumers compose variants and sizes rather than restyling. Until
now that was prose. Boundaries ([0036](0036-package-boundaries-dead-code-and-scaffolding.md))
governs package-to-package imports and ESLint governs code correctness, but nothing checked
whether `apps/web` bypassed the design system's API with `className`.

A measurement on 2026-10-08 (all six `@shadcn/lint` rules run as warnings over `apps/web` and
`packages/ui`) found the app clean on raw colors, arbitrary values, inline styles and dynamic
classes, but **23 `className` overrides on design-system components** in app code — `gap-2` and
`text-muted-foreground` on a `Button`, `text-xs` on an `ItemDescription`, `border-0` on an
`EmptyState` — exactly the drift an agent-driven workflow produces, one `className` at a time.

`@shadcn/lint` (shadcn-ui/lint, MIT, v0.2.0, released 2026-09-14) is an ESLint/Oxlint plugin
that enforces design-system _usage_: it reads `components.json`, each component's `cva`
variants and the Tailwind v4 `@theme` tokens, and its errors tell the author (human or agent)
which variant, size or token to use instead. It resolved our workspace `exports` and Base UI
components without an adapter.

## Decision

**The ownership model.** A design-system component owns its _identity_: color, shape,
typography, and its own internal spacing (padding, the gap between its icon and label). The
consumer owns _placement_ (margin, width, flex position) and _composition_ (what goes inside a
container part and how those children are arranged). The test for any `className` on a
design-system component: would removing it change what the component **is**, or only where it
sits and how its children are laid out? The linter classifies classes, not relationships, so the
model is encoded in one policy object (`designSystemPolicy` in
`packages/eslint-config/react-internal.js`):

- `allow: ["layout", "tabular-nums"]` — placement is always the consumer's; numeric alignment
  is formatting, never a restyle.
- Contract: container parts whose children the consumer composes (`Card*`,
  `DropdownMenuLabel`, dialog/sheet headers and footers, `Alert*`) may arrange them with
  `gap-*` — composition, not restyling.
- Contract: overlay/menu `*Content` containers host arbitrary children and may control their
  own spacing.
- Contract: `rounded-full` on `Button` for the app shell's round icon triggers (two today);
  a third means the Button needs a shape variant — change the component, drop the contract.

**Duplication is a defect, not a style.** A consumer must never repeat a class the component
already applies (`rounded-md` on a `Skeleton`, `h-5` on a `Badge`): it changes nothing today and
silently pins the old value the day the component default changes — an accidental override.
Delete it; the component contract is the default.

**The ladder for an identity change a consumer wants** (in order; stop at the first that
applies):

1. Use what the component already offers (a variant or size — e.g. `variant="ghost"
size="xs"`).
2. Give the component the capability when the need is a design-system concept
   (`EmptyState bordered`, the read-only state of `Input`, interactive hover on `Item` rows
   rendered as buttons). One use does not justify a variant ([0026](0026-choosing-the-right-abstraction.md)); two or three do.
3. A deliberate per-place requirement keeps its `className` — the escape hatch
   [0026](0026-choosing-the-right-abstraction.md) names — and marks it:
   `// eslint-disable-next-line shadcn/no-restyle -- <reason>`. The rule does not ban the
   exception; it makes it explicit in review and auditable in one command
   (`git grep -n "eslint-disable.*shadcn/" -- apps packages`). The second or third identical
   exception is the signal to promote it to a variant and delete the directives. Accepting the
   design-system default instead is a design decision, taken by whoever owns the screen, never
   by a tooling change.

**Adopting a rule is UI-neutral.** Enabling `@shadcn/lint` changed no rendered pixel: every
existing override was either reclassified (composition/formatting), moved into a component
capability with identical output, or kept with a reason. A linter has no mandate to restyle a
product.

Not on the ladder: a wrapper element added only so the class lands outside the component (it
answers a policy gap with DOM and teaches the workaround to everyone who copies the template),
a contract for an identity change, or a disable comment without a reason. Vendored primitives
are grown through their API, a molecule, or — for a genuine state/behavior gap — a tracked
deviation ([0030](0030-component-animation-base-ui-transitions.md)).

**Tooling.** `@shadcn/lint` runs in the React layer of `@workspace/eslint-config`
(inherited by `next-js`), all six rules at `error`, no warning budget (the repo's gate is zero
warnings; the 23 findings were fixed first). Scope: `packages/ui/src/components/**` is the
design system and composes primitives by definition, so `no-restyle` and
`require-static-classes` are off there (our molecules keep the token rules); the vendored
`components/shadcn/**` additionally relaxes `no-arbitrary-values`, `no-inline-styles` and
`no-unknown-classes` (upstream code; three known no-op classes — `cn-input-otp`, drawer
`origin-start/end` — are re-checked on component updates). `packages/email` is on the base
config and untouched: HTML email requires inline styles. Catalog `^0.2.0` (0.x caret allows
patches only; Dependabot and the 24h release-age gate apply). AGENTS.md states the model and
the ladder so agents reach for variants first.

## Consequences

- **Positive:** the design-system contract is enforced where drift happens (consumers), with
  messages that name the fix; the first run converted ad-hoc overrides into variants, accepted
  defaults and three small component capabilities; the policy is one object in the shared
  config, so the model itself is template code.
- **Negative / accepted:** the plugin is three weeks old and pre-1.0 (rule options may change);
  five reasoned exceptions exist in `apps/web` today (the audit command lists them) and must
  be reviewed when they multiply; lint reads `cva` and theme files, so it is slightly slower.
  It bundles shadcn's `cn` engine internally — that does not change [0027](0027-class-merging-keep-clsx-tailwind-merge.md),
  which is about our runtime.
- **Rejected:** `eslint-plugin-tailwindcss` (class validity/order, no design-system contracts),
  hand-written `no-restricted-syntax` patterns (brittle), review-only enforcement (does not
  scale, and agents do not read reviews).

## Revisit triggers

- `@shadcn/lint` 1.0: re-check the rule set and option names; promote any new rule deliberately.
- No release for six months: remove it and keep the policy in prose (`docs/guides`).
- A contract that keeps growing (a third `allow` on the same component) means the component
  needs a variant or prop — change the component, shrink the contract.

## References

- shadcn-ui/lint: <https://github.com/shadcn-ui/lint>; adoption guide:
  <https://github.com/shadcn-ui/lint/blob/main/docs/adoption.md>; rules:
  <https://github.com/shadcn-ui/lint/blob/main/docs/rules.md>
- Measurement and reasoning: the 2026-10-08 analysis in this repository's session notes; ADRs
  0016, 0026, 0030 (vendored deviations), 0036 (boundaries).
