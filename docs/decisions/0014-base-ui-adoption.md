# 0014. Base UI adoption — audit and per-area decisions

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Our components are built on **Base UI** (`@base-ui/react`), consumed through
shadcn's `base-vega` style (see [0007](0007-base-ui-over-radix.md)). Base UI ships
accessible, unstyled primitives but deliberately leaves several _platform_
concerns to the application. "shadcn added the component" is not the same as "we
adopted Base UI correctly", so we audited our adoption against the official Base
UI docs (styling, TypeScript, accessibility, composition, RTL, forms, CSP).

## Findings & decisions

| Area                   | Finding                                                                      | Decision                          |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| Styling                | `className` + `data-[state]`/`data-[side]` + CSS vars, unstyled — done right | ✅ Adopted as-is                  |
| TypeScript             | Components typed via `X.Props` (e.g. `TooltipPrimitive.Provider.Props`)      | ✅ Adopted as-is                  |
| A11y — primitives      | ARIA, keyboard, focus management inherited from Base UI                      | ✅ Adopted as-is                  |
| **A11y — enforcement** | Nothing linted the _developer's_ a11y duties (alt, labels, ARIA)             | ✅ **Fixed** — `jsx-a11y` (below) |
| Composition            | Base UI uses the `render` prop / `useRender`, not Radix `asChild`            | ✅ Convention adopted (below)     |
| RTL                    | `rtl:true` gives logical-property CSS ✓, but `DirectionProvider` is unwired  | ⏸️ Deferred — activate with i18n  |
| Forms                  | `field.tsx` is presentational only — no `Form`, no validation engine         | ⏸️ Deferred — decision pending    |
| CSP                    | Base UI injects inline styles needing a nonce under a strict CSP             | ↪️ Tracked with web-security work |

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
  react-hooks exception ([0013](0013-vendored-ui-lint-exception.md)).

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

### Forms (deferred — decision pending)

- `field.tsx` (base-vega) is **presentational only** — layout plus a manual
  `errors` prop. It is _not_ Base UI's `Field`, and there is no `Form` and no form
  library wired.
- Two lanes to choose from when the first real form appears:
  1. **React Hook Form + zod** — ecosystem default; `field.tsx` is designed for it;
     we already ship `zod` in `packages/ui` (only `react-hook-form` is missing).
  2. **Base UI `Form` + `Field`** — native, no extra library; consolidated error
     handling and validation, but less surrounding ecosystem tooling.
- **Decision:** defer until we build the first form; current lean is **RHF + zod**.
  Trigger: the first non-trivial form.

### CSP (tracked separately)

Base UI injects _functional_ inline styles/scripts (scrollbar hiding on
`ScrollArea`/`Select`, pre-hydration) that a **strict CSP** blocks unless they
carry a nonce via Base UI's `<CSPProvider>`. A **baseline of security headers** is
already in place (`apps/web/next.config.ts`); the **strict CSP + `CSPProvider`** is
deferred because a nonce-based CSP forces every page into dynamic rendering
(losing static optimization, CDN caching, and PPR). This is a web-security
decision recorded in [0015](0015-web-security-headers.md).

## Consequences

- Accessibility is now _enforced_ on our app code, not merely assumed.
- Base UI's platform concerns (RTL, forms, CSP) are explicitly tracked with a
  decision or a deferral + trigger — not silently skipped.
- Styling, TypeScript, and composition follow Base UI's documented model.
