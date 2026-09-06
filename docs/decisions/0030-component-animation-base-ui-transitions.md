# 0030. Component animation — Base UI CSS transitions over keyframes

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

Our components are shadcn/ui built on **Base UI** ([0021](0021-base-ui-selection-and-adoption.md)),
which is headless and drives enter/exit animation through data attributes. Base UI's
[animation handbook](https://base-ui.com/react/handbook/animation) documents three techniques and
states a clear preference:

> **"Transitions are recommended over CSS animations, because a transition can be smoothly cancelled
> midway."** (Close a popup before it finishes opening and it eases back to closed instead of
> snapping.)

- **CSS transitions** — hook the `data-starting-style` (enter-from) / `data-ending-style` (exit-to)
  attributes. **Recommended.**
- **CSS `@keyframes`** — trigger on `data-open` / `data-closed`. This is the `tw-animate-css`
  path (`animate-in`/`animate-out`/`zoom-in`/`slide-in-from-*`) shadcn inherited from its Radix era.
- **JS/Motion** — `render` + `keepMounted` + `element.getAnimations()`.

An audit (2026-09-06) found we were **split and inconsistent**, and it surfaced real defects:

- **Overlay popups** (dialog, alert-dialog, popover, dropdown-menu, tooltip, hover-card, select,
  combobox) used the **keyframe** path — the _non-recommended_ one.
- **Sliders** (sheet, drawer, toast) already used **transitions** — the recommended one.
- **Accordion** was effectively **un-animated**: the `animate-accordion-*` keyframes targeted
  **Radix** CSS vars (`--radix-accordion-content-height`, …) Base UI never sets, and the height
  hooks (`data-starting-style:h-0`) sat on a div with **no `transition-[height]`**.
- **Tooltip** carried dead Radix classes (`data-[state=delayed-open]:*`; Base UI emits `data-open`).
- **Collapsible** had no animation at all; **toggle-group** used Radix's `data-[state=on]` (Base UI
  Toggle emits `data-pressed`), so its "on" background never applied.

## Decision

**Standardize every enter/exit animation on Base UI's recommended CSS-transition model, with one
consistent idiom.** This deviates from the shadcn/`tw-animate-css` keyframe baseline
([0001](0001-decision-making-methodology.md)); the deviation is justified by Base UI's own
authoritative recommendation (transitions are cancellable; keyframes snap on interrupt — worst on
hover-driven tooltip/hover-card).

### The idiom (consistent across the design system)

- **Anchored popups** (popover, dropdown-menu, tooltip, hover-card, select, combobox):
  `origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-snappy` +
  `data-starting-style:opacity-0 data-starting-style:scale-95` +
  `data-ending-style:opacity-0 data-ending-style:scale-95`. Base UI sets `--transform-origin` on the
  popup, so it scales from the trigger — this **replaces** the ad-hoc `slide-in-from-*` directional
  slides (the origin already conveys direction). **Decision (per the `better-ui` skill):** keep
  scale-from-origin rather than restore the directional slide — an anchored popup's origin already
  supplies the "where it came from" cue, and scale-from-origin is the more restrained motion ("brief
  and precise beats prominent"); a directional slide is for anchor-less elements (toasts, cards).
- **Centered modals** (dialog, alert-dialog content): same `transition-[opacity,scale]` (scales from
  center; the `-translate-x/y-1/2` centering is on the separate `translate` property, so it stays
  static — Tailwind v4 keeps `scale`/`translate` independent).
- **Overlays/backdrops**: `transition-opacity duration-150 ease-snappy … data-starting-style:opacity-0 data-ending-style:opacity-0`.
  All scrims (dialog, alert-dialog, **sheet**) share `ease-snappy`; the drawer backdrop keeps its
  own physics curve since it fades in lock-step with the dragged panel.
- **Height (accordion, collapsible)**: `h-(--{accordion,collapsible}-panel-height) overflow-hidden
transition-[height] duration-200 ease-snappy data-starting-style:h-0 data-ending-style:h-0` on the
  `Panel` (Base UI exposes those height vars). Height runs at **200ms** — a hair slower than the
  150ms popups, because a panel can be tall and a brisk 150ms reads as clipped there.
- **Curve & duration**: `ease-snappy` ([0020](0020-ui-foundations-layout-responsiveness-accessibility.md)
  — the design-system reveal curve, already on the sidebar) at `duration-150`. **Sliders keep their
  own tuned cubic-beziers** (drawer physics, toast) — a deliberate different feel per ADR 0020.
- **`transition-[opacity,scale]`, not `transition-transform`**: Tailwind v4 exposes `scale` as its
  own property, so the property list must name `scale` explicitly (and this avoids transitioning a
  modal's centering `translate`).
- **Instant / no-animation states**: tooltip adds `data-instant:duration-0` so Base UI's instant
  shows (grouped/adjacent triggers, keyboard focus — `data-instant`) snap without a fade; select
  disables the transition **and** neutralizes the starting-style (`data-[align-trigger=true]:
data-starting-style:opacity-100/scale-100`) when `alignItemWithTrigger` (its default) positions the
  list over the trigger, so it appears instantly with no first-frame flicker.

### Defects fixed as part of this

- **Accordion**: rewired to `transition-[height]` on the `Panel` using `--accordion-panel-height`
  (removed the no-op Radix-var keyframes).
- **Tooltip**: removed the dead `data-[state=delayed-open]:*` Radix classes.
- **Collapsible**: added the height transition (was un-animated).
- **Toggle-group**: `data-[state=on]` → `data-pressed`.

### What we deliberately did **not** change

- **`keepMounted` stays unused.** Base UI keeps a closing popup mounted through its transition
  automatically (via `element.getAnimations()`), so CSS exit animations play without it; it's only
  needed for JS/Motion-driven exits, which we don't do.
- **Reduced-motion** is already handled globally (`prefers-reduced-motion` clamps both
  `animation-duration` **and** `transition-duration`), so it covers this model unchanged — the
  spinner keeps its essential-motion exemption (WCAG 2.3.3).
- **Sliders** (sheet/drawer/toast) keep their bespoke curves.

## Do's and don'ts

**Do**

- Animate Base UI enter/exit with **transitions** via `data-starting-style` / `data-ending-style`.
- Use the shared idiom above; `ease-snappy` + `duration-150` for reveals; scale from
  `--transform-origin` for anchored popups; `transition-[height]` + `--*-panel-height` for collapses.
- Name explicit properties in `transition-[…]` (Tailwind v4 `scale`/`translate` are separate).

**Don't**

- Don't reach for `tw-animate-css` keyframes (`animate-in`/`animate-out`/`zoom-*`/`slide-in-from-*`)
  for Base UI enter/exit — they snap on interrupt and (for height) target Radix vars Base UI doesn't set.
- Don't use Radix-era attributes on Base UI (`data-[state=open|closed|on|delayed-open]`); Base UI
  uses `data-open`/`data-closed`/`data-pressed`/`data-starting-style`/`data-ending-style`.
- Don't add `keepMounted` for CSS animations; don't re-declare animation on a part that already
  inherits it (e.g. dropdown sub-content inherits the content idiom).

## Updating or adding a shadcn component — check this first, don't skip

shadcn components are **vendored source we own** ([0001](0001-decision-making-methodology.md),
[0005](0005-lint-gate-and-vendored-exception.md)), not a dependency — they change only when someone
re-pulls them. To keep this decision (and every other deviation) from being lost on an update:

1. **Never blind `shadcn add --overwrite <component>`.** It silently restores upstream
   `tw-animate-css` keyframes + Radix `data-[state=…]` attributes and wipes our deviations. To pick
   up an upstream fix, review the diff and merge **selectively**, re-applying our changes.
2. **Adding a NEW Base UI overlay / collapse / toggle component** → convert its animation to this
   ADR's idiom **before committing**: transitions via `data-starting-style`/`data-ending-style`,
   scale from `--transform-origin` (popups) or `transition-[height]` + `--*-panel-height`
   (collapses), `ease-snappy` + `duration-150`; drop the keyframes and any Radix `data-[state=…]`.
3. **Verify — no leftovers in `packages/ui/src/components/shadcn`** (grep):
   `animate-in`, `animate-out`, `slide-in-from`, `animate-accordion`,
   `data-[state=open|closed|on|delayed-open]`. Then run the full gate **including**
   `pnpm --filter storybook build:storybook`.
4. **Find every deviation to re-apply** before/after a re-pull:
   `grep -rn "Deviation\|ADR 00" packages/ui/src/components/shadcn` — each customized file carries an
   inline marker citing its ADR (this one, [0027](0027-class-merging-keep-clsx-tailwind-merge.md)
   class-merge, [0020](0020-ui-foundations-layout-responsiveness-accessibility.md) a11y/motion,
   [0017](0017-backend-architecture-and-migration.md) auth seam, …).

## Consequences

- One consistent, cancellable animation language across the component set; smoother interrupts
  (most noticeable on hover-driven tooltip/hover-card); accordion/collapsible actually animate now.
- Removes the `tw-animate-css` keyframes from enter/exit (the dep still ships `accordion-*` and the
  loop utilities `animate-spin`/`animate-pulse` used by spinner/skeleton, so it stays).
- Visual change: anchored popups now **scale from the anchor** instead of a directional slide.
  Validated by the full gate incl. the Storybook build; there is no automated visual-regression
  test, so a manual smoke-test of the primitives is advisable.

## Revisit triggers

- We adopt a JS animation library (Motion) → then `keepMounted` + `render`/`getAnimations` apply
  (Base UI handbook) and this ADR's CSS-only stance is revisited for those components.
- A component needs a feel the shared idiom can't express → give it its own tuned curve inline
  (as the sliders do), don't fork the idiom.

## Sources

- Base UI — Animation handbook (transitions recommended; `data-starting-style`/`data-ending-style`;
  `keepMounted`; `getAnimations`): <https://base-ui.com/react/handbook/animation>
- Base UI — Accordion / Collapsible (the `--*-panel-height` height-transition pattern):
  <https://base-ui.com/react/components/accordion>, <https://base-ui.com/react/components/collapsible>
- Base UI — Releases (current 1.8.0; the transition model is stable since 1.0):
  <https://base-ui.com/react/overview/releases>

See [0001](0001-decision-making-methodology.md) (shadcn baseline / deviate-with-evidence),
[0020](0020-ui-foundations-layout-responsiveness-accessibility.md) (motion curve, reduced-motion),
and [0021](0021-base-ui-selection-and-adoption.md) (Base UI adoption).
