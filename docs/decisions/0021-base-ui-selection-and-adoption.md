# 0021. Base UI — selection & adoption

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

shadcn/ui components are built on a headless primitive library — historically
**Radix UI**. Two things changed that:

- **Base UI reached v1.0 stable in December 2025** (now v1.6.x, ~6M weekly
  downloads) and is built by the same engineers who created Radix.
- In **July 2026, shadcn/ui made Base UI the _default_** primitive for new
  projects — the community was already choosing it ~2:1 on `shadcn/create`, and
  the team formalized it.

Radix is **not deprecated**: shadcn still supports it, and components ship for
both libraries (unless a component is Base-UI-only). `shadcn init -b radix` opts
a project back onto Radix.

This repo already reflects the new default — `components.json` uses a `base-*`
style (`base-vega`), and `packages/ui/src/components/button.tsx` imports from
`@base-ui/react`.

Selecting Base UI is one decision; **adopting it correctly is another**. Base UI
ships accessible, unstyled primitives but deliberately leaves several _platform_
concerns to the application. "shadcn added the component" is not the same as "we
adopted Base UI correctly", so we also audited our adoption against the official
Base UI docs (styling, TypeScript, accessibility, composition, RTL, forms, CSP).

## Decision: Base UI over Radix (with Radix escape hatch)

Use **Base UI** (`@base-ui/react`) as the component primitive layer, matching
shadcn's current default and Base UI's stable status. Add new components with
the default (Base UI), not `-b radix`.

- Aligned with shadcn's actively-developed default direction.
- Base UI is stable (1.x) and safe to depend on.
- **Radix remains an escape hatch** (`shadcn init -b radix`) if a specific
  component exists only on Radix or needs Radix-specific behavior.

## Adoption — findings & per-area decisions

| Area                   | Finding                                                                      | Decision                           |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| Styling                | `className` + `data-[state]`/`data-[side]` + CSS vars, unstyled — done right | ✅ Adopted as-is                   |
| TypeScript             | Components typed via `X.Props` (e.g. `TooltipPrimitive.Provider.Props`)      | ✅ Adopted as-is                   |
| A11y — primitives      | ARIA, keyboard, focus management inherited from Base UI                      | ✅ Adopted as-is                   |
| **A11y — enforcement** | Nothing linted the _developer's_ a11y duties (alt, labels, ARIA)             | ✅ **Fixed** — `jsx-a11y` (below)  |
| Composition            | Base UI uses the `render` prop / `useRender`, not Radix `asChild`            | ✅ Convention adopted (below)      |
| RTL                    | `rtl:true` gives logical-property CSS ✓, but `DirectionProvider` is unwired  | ⏸️ Deferred — activate with i18n   |
| Forms                  | `field.tsx` is presentational only — no `Form`, no validation engine         | ✅ **Resolved** — RHF + zod (0022) |
| CSP                    | Base UI injects inline styles needing a nonce under a strict CSP             | ↪️ Tracked with web-security work  |

### Accessibility enforcement — `jsx-a11y` (done)

- **What it is / needs:** `eslint-plugin-jsx-a11y`, a devDependency that lints raw
  JSX for accessibility problems — missing `alt`, unlabeled controls, misused
  ARIA, click handlers on non-interactive elements.
- **What it solves:** Base UI guarantees accessible _primitives_, but its docs are
  explicit that the _developer_ still owns `alt` text, form labels, and colour
  contrast. Nothing enforced those: `@next/eslint-plugin-next` covers Next
  correctness (not a11y), and we don't use the full `eslint-config-next`
  meta-package (which would have bundled `jsx-a11y`).
- **Decision:** enabled in the **Next config only** (`apps/web`). Zero bundle cost
  (devDependency), per the dependency-weight rule in `AGENTS.md`.
- **Why not `packages/ui`:** those components are vendored from shadcn/Base UI and
  already handle their own accessibility. Linting them would flag code we didn't
  author and fail the hard gate for no real gain — the same reasoning as the
  react-hooks exception ([0005](0005-lint-gate-and-vendored-exception.md)).

### Composition — `render` / `useRender` (convention)

- Base UI's polymorphism is the **`render` prop** (element or function), _not_
  Radix's `asChild`. To render a part as a custom element, pass
  `render={<MyThing />}`; the custom component must forward `ref` and spread props.
  Use the **`useRender`** hook to add a render prop to our own components.
- **Decision:** adopt `render`/`useRender` as the composition convention. No code
  change today — it applies whenever we build custom components on Base UI.

### RTL (deferred)

- `components.json` `rtl:true` already makes shadcn emit logical properties
  (`inline-start/end`), which is good practice regardless — **kept**.
- `DirectionProvider` (wrapped by `direction.tsx`) is **not mounted**, and mounting
  it with a static `dir` does nothing. RTL activation is an **i18n** concern
  (locale → `dir`).
- **Decision:** leave prepped; wire `DirectionProvider` + a dynamic `dir` when
  internationalization lands. Trigger: adding i18n / an RTL locale.

### Forms — resolved: React Hook Form + zod (2026-08-16)

- `field.tsx` (base-vega) is **presentational only** — layout plus a manual
  `errors` prop. It is _not_ Base UI's `Field`, and there is no `Form` and no form
  library wired.
- **Decision:** adopt **React Hook Form + zod**, bound to the `Field` primitives via
  `useController` (our inputs are Base UI, so `register` gives no perf win —
  [mui/base-ui#3819](https://github.com/mui/base-ui/issues/3819)). We do **not** add
  shadcn's `<Form>`/`<FormField>`: it is Radix-Slot-based and we run no Radix. The full
  rationale — `isSubmitting`-over-`useTransition`, the `root.serverError` contract, and the
  reusable field layer — lives in
  [0022](0022-forms-rhf-submission-and-pending.md).
- **Rejected:** Base UI's own `Form` + `Field` engine (less surrounding ecosystem) and
  **TanStack Form** (smaller ecosystem).

### CSP (tracked separately)

Base UI injects _functional_ inline styles/scripts (scrollbar hiding on
`ScrollArea`/`Select`, pre-hydration) that a **strict CSP** blocks unless they
carry a nonce via Base UI's `<CSPProvider>`. A **baseline of security headers** is
already in place (`apps/web/next.config.ts`); the **strict CSP + `CSPProvider`** is
deferred because a nonce-based CSP forces every page into dynamic rendering
(losing static optimization, CDN caching, and PPR). This is a web-security
decision recorded in [0015](0015-web-security-headers.md).

### Toast — native Base UI (not Sonner), + component re-audit (2026-08)

- The `base-vega` style ships a **native Base UI Toast** (`@base-ui/react/toast`). We
  migrated off **Sonner** (the Radix-era third-party toast) to `toast.tsx` (Toaster + a
  `toast.add()` manager), matching our Base UI commitment.
- A full sweep confirmed **no Radix components remain** — every interactive primitive is
  Base UI. The six third-party components are the standard shadcn deps with **no Base UI
  equivalent**, so they stay: `react-day-picker` (calendar), `cmdk` (command),
  `embla-carousel-react` (carousel), `recharts` (chart), `input-otp`, and
  `react-resizable-panels`.
- **Prefer a shadcn primitive over hand-rolling** — e.g. the password show/hide field uses
  `input-group` rather than an absolutely-positioned button.

## Consequences

- Aligned with shadcn's actively-developed default direction; Base UI is stable
  (1.x) and safe to depend on, with Radix retained only as an escape hatch.
- Accessibility is now _enforced_ on our app code, not merely assumed.
- Base UI's platform concerns (RTL, forms, CSP) are explicitly tracked with a
  decision or a deferral + trigger — not silently skipped.
- Styling, TypeScript, and composition follow Base UI's documented model.

## Sources

- shadcn "Base UI as the Default" changelog and Base UI docs — see
  [../references.md](../references.md).

## See also

- **[0020](0020-ui-foundations-layout-responsiveness-accessibility.md)** — the
  codebase-wide **layout, responsiveness (mobile → TV) & semantic-HTML/accessibility**
  conventions built on this adoption: Base UI is _behavior, not layout_; page semantics
  (landmarks + heading levels) that shadcn's `<div>`-based `Card` deliberately leaves to
  us; and the `start-`/`end-` logical-utility convention.
