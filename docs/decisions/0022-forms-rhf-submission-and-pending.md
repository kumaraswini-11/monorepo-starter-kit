# 0022. Forms — React Hook Form + zod, submission & pending-state

- **Status:** Accepted
- **Date:** 2026-08-15 (RHF + zod, presentational); 2026-08-16 (submission & pending-state pattern)

## Context

Before building the auth UI we ran a full front-end architecture R&D pass, held to one bar:
**build the complete UI wiring-agnostic now → decide the backend later → wire it up with no
UI rewrite** (the backend was undecided and this repo is reused as a template). Forms were
the first concrete piece; the rest of that architecture — routing, data-fetching, state,
route boundaries — is [0023](0023-app-shell-routing-and-boundaries.md).

We adopt **React Hook Form + zod** for forms (below). That still leaves an interaction
question that recurs on **every** form: what should the UI do while a submit / API call is
in flight? We want **one** consistent, accessible, enterprise-appropriate answer — encoded
in the shared form layer, not re-decided per form. Two concrete sub-questions drove that
part:

1. Should the **other fields** be disabled while the call is in flight?
2. What **in-flight state** should the submit control show?

## R&D — in-flight UX (what the sources say)

**Disabling controls during submit**

- Disabling _during an active submit_ to prevent double-submit is the accepted use,
  especially for short forms (login). ([RHF discussion #3024], [enable-vs-disable].)
- But a hard `disabled` removes the control from the tab order and **drops focus**; the
  a11y-preferred alternative is not disabling inputs (or `aria-disabled` + blocking the
  action). ([Adrian Roselli — Don't Disable Form Controls].)

**In-flight submit state**

- Convey status with **text**, not a bare spinner: swap the label ("Sign in" →
  "Signing in…"); the spinner graphic is decorative (`aria-hidden`). Put **`aria-busy`** on
  the busy container, and don't drop the button to low contrast.
  ([Bekk — accessible loading button], [GitHub Primer], [Deque], [UX Movement].)

## Decision

### Forms — React Hook Form + zod, **presentational** (adopted)

- **RHF + zod:** ecosystem default; first-class zod resolver; purely **client-side** so a
  form can submit **anywhere**. Our shadcn `FieldError` already takes RHF's error shape, and
  **`zod` already ships** in the repo (schemas shared client + server).
- **Presentational pattern (the lock-in breaker):** form components receive an
  **injected `onSubmit`** and know nothing about _where_ the data goes. The same
  `<SignInForm onSubmit={…}>` works with the Better Auth browser client (fullstack) **or** a
  `fetch` to a separate API — no rewrite when the backend is decided.
- **Rejected for the wiring layer:** `useActionState` + **Server Actions** — powerful, but
  **Next-fullstack-only**; wiring forms to them locks the frontend to Next-as-backend,
  contradicting the undecided-backend constraint. **TanStack Form** is promising but has a
  smaller ecosystem; RHF is the safer default (2026 library survey + shadcn/zod alignment).
- **Refines [0019](0019-nextjs-rendering-and-performance.md) §2**, which (assuming fullstack)
  prescribed `useActionState`. That remains valid **if/when we commit to fullstack**; the
  **default wiring-agnostic form** is RHF + an injected handler.

**Implementation (adopted 2026-08-16 — the auth flow is the first non-trivial form).**

- **`useController`, not `register`.** Our inputs are **Base UI** primitives, which re-render
  on every keystroke even when registered uncontrolled
  ([mui/base-ui#3819](https://github.com/mui/base-ui/issues/3819)) — so `register`'s
  uncontrolled-perf win doesn't apply here. `useController` isolates re-renders to the one
  field, is RHF's documented path for external UI libraries, and gives the password field its
  live value for the strength meter.
- **Bound to the Base UI `Field` primitives, not shadcn's `<Form>`/`<FormField>`** — that
  wrapper is Radix-Slot-based and we run no Radix
  ([0021](0021-base-ui-selection-and-adoption.md)).
- **`formState.isSubmitting` is the pending state** (RHF owns the async submit lifecycle), so
  these client forms use **no `useTransition`**. `useTransition` / `useActionState` stay
  reserved for **Server Actions** (the fullstack path) — no conflict, since we wire via an
  injected client handler.
- **Server errors → `setError("root.serverError")`**, rendered by a `FormError` banner
  (`role="alert"`, which also **takes focus** when it appears); field-level (validation)
  errors stay inline. The **safe-by-default** rule (only a thrown **`FormSubmitError`** is
  shown verbatim; any other throw shows a generic message) and the full submit/pending
  pattern (enabled fields, disabled button + re-entrancy guard, `aria-busy`, spinner + label,
  focus-to-error) are in the **submission & pending-state** decision below.
- **Validation timing:** RHF's default `mode: onSubmit` + `reValidateMode: onChange` is
  exactly "reward early, punish late" — no config needed.
- **Reusable layer** (`apps/web/components/form/`): `Form`, `SubmitButton`, `FormError`,
  `FormTextField` / `FormPasswordField`, `submitWithFormError`, plus the generic
  `PasswordInput` / `PasswordStrength` primitives (relocated here from `auth/` — they are
  **not** auth-specific). Kept in `apps/web` as **app-level-shared** (RHF is app-only for
  now); the whole folder promotes to `packages/ui` at the first 2nd-app trigger
  ([0016](0016-shared-code-and-package-boundaries.md)). The Settings change-password form
  reuses these with the `passwordField` schema rule. **(Revised 2026-08-16: the form layer +
  `PasswordInput`/`PasswordStrength` now live in `@workspace/ui` (`components/form`), with
  `react-hook-form` as a `@workspace/ui` dependency — the single design system; see
  [0016](0016-shared-code-and-package-boundaries.md) → Component placement.)**

### Submission & pending-state pattern

One pattern, encapsulated in a shared `Form` + `SubmitButton` + `FormError` layer, so every
form (and every future form) inherits it:

1. **Fields stay enabled during submit.** Only the **submit button** is disabled, plus a
   **re-entrancy guard** in `submitWithFormError` (ignores a second submit while one is in
   flight — covers the Enter key, which the disabled button does not, and which RHF does not
   promise to block). Double-submit is fully prevented **without ever dropping keyboard
   focus**.
2. **Submit button = spinner (`aria-hidden`) + progressive label** ("Signing in…",
   "Creating account…"), disabled while submitting, full-width (no layout shift on the label
   swap). `SubmitButton` subscribes only to `isSubmitting`.
3. **`aria-busy` on the `<form>`** while submitting (announces the busy state).
4. **On a server error, focus moves to the `FormError` banner** (`role="alert"`, so it is
   also announced) — because clicking submit disables the button and drops focus to `<body>`,
   this lands keyboard/AT users on the error. Field-validation errors stay inline (RHF focuses
   the first invalid field via `shouldFocusError`).
5. **Server errors are safe-by-default:** only a thrown **`FormSubmitError`** (deliberately
   user-safe copy from the wiring layer) is shown verbatim; anything else shows a generic
   message, so a raw upstream/SDK error or an enumeration hint can never leak (relevant to the
   compliance framing).

## Options considered

| Question             | Options                                                                          | Chosen              | Why                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disable other fields | (a) disable all controls; (b) disable **button only** + guard                    | **(b)**             | double-submit is already prevented by (b); (a) adds only the focus-loss cost (Enter-submit disables the field)                                                               |
| Button loading UI    | (a) bare spinner; (b) centered/overlay loader; (c) spinner + label in the button | **(c)**             | feedback at the action, announced via text, no context jump; (a) isn't announced; (b) is for page transitions                                                                |
| Disabled mechanism   | (a) native `disabled`; (b) `aria-disabled` + guard                               | **(a)** (pragmatic) | native double-submit + simplest; the click-focus cost is covered by focus-to-error. (b) is more a11y-pure but more moving parts — revisit if we build a design-system button |

## Consequences

- Every form gets the same accessible in-flight behaviour for free via `Form` /
  `SubmitButton` / `FormError` — no per-form pending wiring, and the re-render subscriptions
  stay isolated (the parent form reads no form state).
- The one residual trade-off (clicking submit drops focus from the now-disabled button) is
  handled by **focus-to-error** on failure and **navigation** on success.
- If we later add a design-system button, we can upgrade mechanism (a)→(b) (`aria-disabled`,
  full contrast, stays focusable) in `SubmitButton` alone.
- **No backend lock-in** — the same presentational forms + injected handlers target Next
  fullstack or a separate backend without a UI rewrite.

## Addendum — unique field ids (`useId`)

_Added 2026-08-27 (surfaced in the app-shell review,
[0023](0023-app-shell-routing-and-boundaries.md))._

The shared field components also produce **unique DOM ids per instance**. `FormTextField` /
`FormPasswordField` derive `id`, the label's `htmlFor`, and `aria-describedby` from
**`React.useId()`** (`` `${useId()}-${name}` ``), not from `name` alone (`name` still drives RHF +
autofill). One-form-per-page (the auth routes) hid the problem, but multi-form pages are coming —
Settings has profile + change-email + change-password, several sharing a field named
`email` / `password`. With `id={name}` those repeat, producing **duplicate DOM ids**, so
`htmlFor` / `aria-describedby` resolve to the **first** match (a label focuses the wrong input;
the wrong field's error is announced) — invalid HTML and a broken programmatic association
(WCAG 1.3.1). Fixed in the shared primitive before the multi-form consumer exists; no test impact
(`getByLabel` / `getByRole` resolve via the for/id link, not the id's value).

## Addendum — password-strength colour & form rhythm

_Added 2026-08-27 (UI review)._

- **"Good" and "Strong" deliberately share the success hue.** The strength meter advances by
  **filled-segment count (3 vs 4) + the text label**, not colour alone, so a same-hue top pair is
  intentional (varying the hue for extra signal is an optional future refinement, not a bug).
- **One owner of vertical rhythm.** `Form` (`gap-6`) and shadcn's `FieldGroup` (`gap-7`) both set
  vertical spacing; prefer a single owner — defer to `FieldGroup`'s baseline rather than editing
  the vendored primitive — so stacked fields don't mix 24px / 28px gaps.

## Sources

- RHF adoption R&D (2026-08-16): **React Hook Form** + **`@hookform/resolvers`** docs (via
  context7), the 2026 form-library surveys (RHF vs TanStack Form vs plain state), and the
  Base UI ↔ RHF integration finding
  ([mui/base-ui#3819](https://github.com/mui/base-ui/issues/3819)).
- React Hook Form — [`handleSubmit` docs][rhf-handlesubmit] · [double-submit discussion #3024][RHF discussion #3024]
- [Adrian Roselli — Don't Disable Form Controls]
- [Bekk — accessible loading button]
- [GitHub Primer — button accessibility]
- [Deque — anatomy of accessible forms]
- [UX Movement — when to show a button's loading state]
- [React — `useId`][react-useid] · [MDN — the `id` attribute must be unique][mdn-id] · [WCAG 1.3.1 — Info and Relationships][wcag-131]

[rhf-handlesubmit]: https://react-hook-form.com/docs/useform/handlesubmit
[RHF discussion #3024]: https://github.com/orgs/react-hook-form/discussions/3024
[enable-vs-disable]: https://medium.com/@uxaqin/effective-form-submission-enable-or-disable-choosing-the-best-approach-for-ux-348cc3f00d21
[Adrian Roselli — Don't Disable Form Controls]: http://adrianroselli.com/2024/02/dont-disable-form-controls.html
[Bekk — accessible loading button]: https://www.bekk.christmas/post/2023/24/accessible-loading-button
[GitHub Primer]: https://primer.style/product/components/button/accessibility/
[GitHub Primer — button accessibility]: https://primer.style/product/components/button/accessibility/
[Deque]: https://www.deque.com/blog/anatomy-of-accessible-forms-best-practices/
[Deque — anatomy of accessible forms]: https://www.deque.com/blog/anatomy-of-accessible-forms-best-practices/
[UX Movement]: https://uxmovement.com/buttons/when-you-need-to-show-a-buttons-loading-state/
[UX Movement — when to show a button's loading state]: https://uxmovement.com/buttons/when-you-need-to-show-a-buttons-loading-state/
[react-useid]: https://react.dev/reference/react/useId
[mdn-id]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id
[wcag-131]: https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html

## See also

- [0023](0023-app-shell-routing-and-boundaries.md) — routing, client data-fetching, state &
  route boundaries; the rest of the wiring-agnostic front-end architecture (the forms decision
  originated in its §2).
- [0019](0019-nextjs-rendering-and-performance.md) — rendering model / React 19 form idiom
  (refined here: `useActionState` is the fullstack option, not the default wiring).
- [0021](0021-base-ui-selection-and-adoption.md) — Base UI; the forms deferral resolved here,
  and the `Field` primitives these forms bind to.
- [0016](0016-shared-code-and-package-boundaries.md) — where the shared `components/form`
  layer now lives (`@workspace/ui`).
- [0020](0020-ui-foundations-layout-responsiveness-accessibility.md) — UI foundations; the
  "submit stays enabled until valid" a11y stance this builds on.
- [0025](0025-testing-strategy.md) — how these forms and the pending/error contract are
  tested (component + seam tests).
