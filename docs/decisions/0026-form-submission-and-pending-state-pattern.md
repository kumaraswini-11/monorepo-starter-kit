# 0026. Form submission & pending-state UX pattern

- **Status:** Accepted
- **Date:** 2026-08-16

## Context

We adopted React Hook Form + zod for forms ([0025 §2](0025-frontend-architecture-forms-data-state-routing.md)).
That leaves an interaction question that recurs on **every** form: what should the UI do
while a submit / API call is in flight? We want **one** consistent, accessible,
enterprise-appropriate answer — encoded in the shared form layer, not re-decided per form.
Two concrete sub-questions drove this:

1. Should the **other fields** be disabled while the call is in flight?
2. What **in-flight state** should the submit control show?

## R&D — what the sources say

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

One pattern, encapsulated in a shared `Form` + `SubmitButton` + `FormError` layer
(`apps/web/components/form/`), so every form (and every future form) inherits it:

1. **Fields stay enabled during submit.** Only the **submit button** is disabled, plus a
   **re-entrancy guard** in `submitWithFormError` (ignores a second submit while one is in
   flight — covers the Enter key, which the disabled button does not, and which RHF does not
   promise to block). Double-submit is fully prevented **without ever dropping keyboard
   focus**.
2. **Submit button = spinner (`aria-hidden`) + progressive label** ("Signing in…",
   "Creating account…"), disabled while submitting, full-width (no layout shift on the
   label swap). `SubmitButton` subscribes only to `isSubmitting`.
3. **`aria-busy` on the `<form>`** while submitting (announces the busy state).
4. **On a server error, focus moves to the `FormError` banner** (`role="alert"`, so it is
   also announced) — because clicking submit disables the button and drops focus to
   `<body>`, this lands keyboard/AT users on the error. Field-validation errors stay inline
   (RHF focuses the first invalid field via `shouldFocusError`).
5. **Server errors are safe-by-default:** only a thrown **`FormSubmitError`** (deliberately
   user-safe copy from the wiring layer) is shown verbatim; anything else shows a generic
   message, so a raw upstream/SDK error or an enumeration hint can never leak
   ([0025 §2](0025-frontend-architecture-forms-data-state-routing.md); relevant to the
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
- If we later add a design-system button, we can upgrade mechanism (a)→(b)
  (`aria-disabled`, full contrast, stays focusable) in `SubmitButton` alone.

## Sources

- React Hook Form — [`handleSubmit` docs][rhf-handlesubmit] · [double-submit discussion #3024][RHF discussion #3024]
- [Adrian Roselli — Don't Disable Form Controls]
- [Bekk — accessible loading button]
- [GitHub Primer — button accessibility]
- [Deque — anatomy of accessible forms]
- [UX Movement — when to show a button's loading state]

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

## See also

- [0025 §2](0025-frontend-architecture-forms-data-state-routing.md) — RHF + zod adoption,
  the field layer, and the `root.serverError` contract.
- [0024](0024-ui-foundations-layout-responsiveness-accessibility.md) — UI foundations; the
  "submit stays enabled until valid" a11y stance this builds on.
