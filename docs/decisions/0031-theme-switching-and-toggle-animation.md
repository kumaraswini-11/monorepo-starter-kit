# 0031. Theme switching & toggle animation

- **Status:** Accepted (implementation deferred)
- **Date:** 2026-09-07
- **Implementation:** deferred — this ADR records the decision, the R&D, and the exact
  technique to use; the `apps/web/components/theme/theme-toggle.tsx` change (the WAA
  icon cross-fade in §Decision) lands in a follow-up. Until then the toggle keeps the
  instant `hidden`/`dark:block` swap described under _Context_. The Consequences below
  are the **expected** outcome once implemented.

## Context

We wanted the light↔dark theme switch to feel "smooth." "Smooth" sounds like one
thing but decomposes into **two independent decisions** with very different
risk/value profiles, and conflating them is what leads people to the wrong fix:

1. **The whole-page color flip** — instant, or animated (a color transition, a
   View-Transitions crossfade, or a circular reveal)?
2. **The toggle control's icon** (sun↔moon) — a hard cut, or an animated swap?

**Baseline before this ADR.** We use `next-themes` in
`apps/web/components/theme/theme-provider.tsx` with
`attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`
(shadcn's recommended config), so the page **snaps instantly** — which is correct
(see Decision §1). The toggle in `theme-toggle.tsx` swaps the icons with
`className="hidden dark:block"` / `"block dark:hidden"` — i.e. a **`display`
toggle**. `display` is **not animatable** and removes the node, so the icon is a
**hard cut that can never animate**, and it gives no feedback that the click
registered. It is also an **undocumented deviation from shadcn's own baseline**
(shadcn's toggle animates the icon — [0001](0001-decision-making-methodology.md)),
so fixing it is a _return to baseline_, not gold-plating. The flip fires from
several entry points — the header/account menu, the public-page `ThemeToggle`, the
⌘K palette, the ⌘⇧L quick-flip ([0023](0023-app-shell-routing-and-boundaries.md)),
and OS `system`/auto changes — so whatever we choose must behave under all of them.

This ADR was preceded by deep R&D (official docs + reputable UX/accessibility
sources; full list in _Sources_) and honest critique of every option, per
[0001](0001-decision-making-methodology.md).

## The anti-pattern to never adopt: page-wide color transitions

Putting a CSS `transition` on `color`/`background`/`border` across the page (let
alone `transition: all`) and then flipping the theme is a genuine anti-pattern for
**two independent reasons**:

- **It smears.** Elements with different transition durations finish at different
  times, so the page repaints in a staggered wave instead of flipping as one unit;
  the technique also "fails entirely for images, icons, and properties that don't
  support transitions" (Paco Coursey, the article `next-themes` links as its
  rationale — see _Sources_).
- **It is a full-DOM repaint.** `color`/`background`/`border`/`box-shadow`/gradients
  are **not** compositor-only (unlike `transform`/`opacity`/`filter`), so
  transitioning them on nearly every element at once forces repaint/rasterization
  across the whole tree — expensive, and worst for INP on mobile.

This is exactly why `next-themes` ships `disableTransitionOnChange` (it injects
`* { transition: none !important }`, forces a reflow via `getComputedStyle`, applies
the theme, then removes the style — making the color swap **instant**), and why
shadcn enables it by default. **We already have it on; we keep it on.**

## What the major design systems actually do

The professional norm is unanimous — **instant page snap; the only motion is the
toggle icon.** Full-page crossfades/reveals are a marketing/portfolio flourish, not
enterprise app chrome.

| System                    | Page on switch                            | Toggle icon                                               |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| **shadcn/ui** (own docs)  | **instant** (`disableTransitionOnChange`) | **animated** — sun/moon rotate ±90° + scale 1↔0 crossfade |
| Vercel / Geist, Next docs | instant (`next-themes` lineage)           | icon swap                                                 |
| GitHub Primer             | instant token flip (`data-color-mode`)    | —                                                         |
| Material Design 3 (web)   | instant token swap                        | — (native: optional per-color tween, never full-page)     |
| Apple HIG                 | no in-app switch animation prescribed     | — (macOS crossfade is an OS-compositor effect)            |
| Tailwind site, MDN        | instant                                   | instant / icon swap                                       |

## Accessibility — the bright line (this decides the options)

- **WCAG 2.3.1 Three Flashes (A):** about >3 flashes/second. A single theme flip is
  one state change — **not a concern** for any option here.
- **WCAG 2.3.3 Animation from Interactions (AAA):** interaction-triggered motion
  must be disable-able unless essential. The **load-bearing nuance** (W3C): _"Motion
  animation does not include changes — such as changes of color or opacity — that do
  not alter the perceived size, shape, position, or distance/depth."_ Therefore:
  - An instant snap, and an **icon opacity/scale cross-fade, are _not_ "motion"**
    under 2.3.3 → **no gating required**. (Scale changes size, but on a single 16px
    glyph it is not a vestibular trigger; the safe, self-contained kind.)
  - A **View-Transitions circular reveal animates `clip-path` (size/shape/position)**
    → it **is** motion under 2.3.3 → it carries a **permanent** `prefers-reduced-motion`
    obligation and must ship an instant fallback.
- **`prefers-reduced-motion`:** already honored globally in `globals.css` (a `reduce`
  block clamps `animation-duration` **and** `transition-duration` to ~0), so the
  chosen option inherits reduced-motion handling without new code.

## Options considered

### Option A — instant page + real icon cross-fade — **CHOSEN**

Keep `disableTransitionOnChange` (instant, honest page). Fix the `display`-swap bug:
stack sun+moon and cross-fade `opacity`+`scale` (+ a small `rotate`), ~200ms,
`ease-snappy` ([0020](0020-ui-foundations-layout-responsiveness-accessibility.md)),
per the `better-ui` icon-transition idiom and shadcn's pattern.

- Delivers the "smooth" **where it carries meaning** — feedback on the control you
  clicked — not as decoration on a self-evident, global change.
- **Zero accessibility risk** (not "motion" under 2.3.3 → no gating), **zero perf
  cost** (compositor-only, one tiny element), no repaint.
- Realigns us with the shadcn baseline and our own `better-ui` skill +
  [0030](0030-component-animation-base-ui-transitions.md) animation language.

### Option B — View-Transitions circular reveal — declined for app chrome, documented for marketing

Technically production-viable: same-document View Transitions reached **Baseline
"newly available" on 2025-10-14** (Chrome/Edge 111+, Safari 18+, Firefox 144+). But
it is the wrong **default**, and for the authed shell the wrong choice outright:

- It is **motion under WCAG 2.3.3 (AAA)** for a change that is global and
  self-evident — so, by NN/g's test, motion adds **no comprehension value** here;
  it is pure spectacle.
- It carries **permanent obligations**: feature-detect + instant fallback (only
  _newly_ available, so a real tail of old browsers), gate on
  `prefers-reduced-motion`, and use `flushSync` — because `next-themes` applies the
  `<html>` class in a **`useEffect`**, so a naive
  `document.startViewTransition(() => setTheme(x))` snapshots the **old** colors;
  the class must be committed synchronously inside the transition callback.
- It **freezes interaction** while the browser snapshots the viewport.
- It cuts against this repo's stated **motion-restraint** principle for app chrome.

If ever used (marketing/landing pages only), the reference shape is: keep
`disableTransitionOnChange` on; `document.startViewTransition(() => flushSync(() =>
setTheme(next)))`; animate `::view-transition-new(root)` `clip-path` from the
toggle's coordinates on `transition.ready`; the MDN `isolation:auto` /
`animation:none; mix-blend-mode:normal` snapshot CSS; a
`@media (prefers-reduced-motion: reduce) { ::view-transition-group(*),
::view-transition-old(root), ::view-transition-new(root){ animation:none !important } }`
gate; and a `"startViewTransition" in document` feature guard with a plain
`setTheme` fallback. Use **manual `document.startViewTransition`**, not React's
experimental `<ViewTransition>` / Next's experimental flag / `next-view-transitions`
— those are **route/navigation** tools and still experimental (`unstable_`), a poor
fit for a compliance-bound template and for a non-navigation interaction.

### Option C — status quo (do nothing)

Fully accessible and honest, but keeps a no-feedback hard cut and leaves the
shadcn-baseline polish (and the smoothness we were asked for) on the table.

## Icon technique — cross-fade over morph (morph considered and declined)

Having chosen to animate the icon (Option A), the sub-question is _how_: the
**cross-fade / swap** (two Lucide glyphs, one rotates+scales+fades out while the
other in — what we shipped) versus a true **morph** (a single element that
shape-shifts: sun rays retract and a mask carves the crescent). A dedicated R&D pass
(sources below) came down firmly on the cross-fade:

- **No major enterprise design system ships a sun→moon morph.** shadcn = swap;
  **Material 3** = "exiting icon fades out, entering fades in, subtly scaling up,"
  with morph explicitly reserved for high-emphasis brand moments; **Vercel/Geist**
  goes the _other_ way — a segmented Light/System/Dark control (which our
  `ThemeRadioGroup` already is) and its docs say _don't_ rebuild it as icon buttons;
  **GitHub Primer / IBM Carbon / Shopify Polaris / Atlassian / Microsoft Fluent** =
  a settings/segmented choice with an instant token flip. Morphs live in **tutorials**
  (Adam Argyle's web.dev component) and **component marketplaces**, not design systems.
- **Purpose test (NN/g):** a morph earns its complexity when it _disambiguates_ (the
  canonical hamburger→X, where the X closes what the ☰ opened). A theme toggle is
  self-evident and its result is globally, instantly confirmed by the page flip, so a
  morph communicates nothing the resting glyph and the flip don't — it is decoration,
  not comprehension.
- **Our stack fights a CSS morph.** `disableTransitionOnChange` suppresses
  `transition`s during the flip, so a transition-based morph (Argyle's approach) is
  killed at the moment it should play; forcing it onto one-shot `@keyframes` makes it
  **non-interruptible** — the wrong tool for a rapid-toggle control (`better-ui`).
- **It breaks our rules.** A morph is either a **bespoke off-style glyph** (violates
  "one icon library per surface" — we standardize on Lucide) or a **new client
  runtime dependency** for cosmetic chrome (against dependency-weight discipline):
  `@theme-toggles/react` ships its own non-Lucide glyphs and its stable npm release is
  ~4 years stale; `morphicons` preserves Lucide geometry but drags a _parallel_
  `lucide` package alongside our `lucide-react`, is young (cooldown applies), and
  defaults `prefers-reduced-motion` **off** (an a11y footgun for a template others
  copy); Lottie is ~250 KB for a 16px glyph (rejected outright).
- **More WCAG 2.3.3 exposure.** A morph adds translational, multi-part motion (a mask
  travels, rays retract, often ~500ms with elastic overshoot) — more squarely "motion
  animation" than our opacity/scale/rotate cross-fade, and its reduced-motion gating
  becomes _load-bearing_ (a clamped morph can freeze at an ambiguous half-crescent
  unless a clean discrete end-state is hand-authored). Our cross-fade resolves to a
  full, correct glyph for free and is already covered by the global reduced-motion
  block.

**Declined.** The cross-fade is the enterprise norm, zero-dependency,
Lucide-consistent, interruptible-friendly, and minimally exposed under 2.3.3. Revisit
only if a **marketing/brand** surface wants a morph — then `morphicons`
(`reducedMotion="user"`) is the only option that keeps Lucide geometry, at the cost of
a runtime dep + a parallel Lucide pipeline.

## Decision

**Adopt Option A.**

1. **Page flip stays an instant snap; keep `disableTransitionOnChange`.** Never
   animate page-wide colors (the smear + repaint anti-pattern above).
2. **Animate the toggle icon** with a sun↔moon cross-fade: two icons **kept mounted**
   and stacked (grid, same cell). **Resting visibility is CSS-only**, keyed to the
   `.dark` class the blocking `next-themes` script sets before first paint — so the
   swap is hydration-safe (no dependence on `resolvedTheme` for what renders, no
   flash). The **motion** fades/scales/rotates the entering icon in and the leaving
   one out at ~200ms `ease-snappy`. Icons use `currentColor`; `aria-label` + the icon
   remain the static state cue.
3. **Mechanism: the Web Animations API (`element.animate`), driven by `resolvedTheme`
   — not a CSS `transition`, and not a CSS `@keyframes` keyed to `.dark`.** Two
   constraints force this:
   - A CSS **transition** is **suppressed** during the swap — `disableTransitionOnChange`
     injects `transition: none !important` around the flip, so a transition-based icon
     animation just snaps (this is why shadcn's own transition-based toggle icon does
     not actually animate under `disableTransitionOnChange`).
   - A CSS **`@keyframes` keyed to `.dark`** survives that suppression, **but replays
     on every hard page load** (the animation runs whenever the element first mounts
     with the class), which violates the `better-ui` "skip animation on page load"
     rule, and pure CSS cannot tell "mount" from "real change".
     Firing the animation imperatively from a `useEffect` on `resolvedTheme`, with a
     `prevTheme` ref that **skips the first resolved value**, animates on real changes
     only (never on load), covers **every entry point** (menu, ⌘⇧L, OS `system`/auto —
     all move `resolvedTheme`), and is unaffected by the `transition:none` window. It
     is dependency-free (no motion library) per [0016](0016-shared-code-and-package-boundaries.md).
4. **Reduced motion** is honored in the effect itself (a `prefers-reduced-motion: reduce`
   check returns before animating, so the swap is instant and correct), on top of the
   global `globals.css` reduced-motion block.
5. **View Transitions (Option B) is deliberately declined for the app** and recorded
   above as a marketing-only, fully-gated option, so the analysis is not lost.

## Do's and don'ts

**Do**

- Keep `disableTransitionOnChange` on the `ThemeProvider`.
- Animate the toggle icon imperatively (WAA `element.animate`) from a `useEffect` on
  `resolvedTheme`, guarded to skip the first resolved value and reduced-motion.
- Keep resting visibility as CSS keyed to `.dark` (hydration-safe); both icons mounted
  and stacked.

**Don't**

- Don't add `transition` on colors/background/border for the theme flip (smear +
  repaint), and don't remove `disableTransitionOnChange`.
- Don't animate the icon with a CSS `transition` (suppressed during the flip) or a
  `@keyframes` keyed to `.dark` (replays on every page load).
- Don't animate the icon with a `display`/`hidden` toggle (not animatable).
- Don't add a View-Transitions reveal to the authed app shell; if used on marketing
  pages it must be feature-detected + `prefers-reduced-motion`-gated + `flushSync`.

## Consequences

- The theme toggle gives immediate, on-brand feedback (a smooth icon cross-fade)
  without any page repaint, accessibility gating, or perf cost — and it re-aligns
  the toggle with the shadcn baseline it had drifted from (and, unlike that baseline,
  the icon **actually animates** under `disableTransitionOnChange`).
- The page keeps flipping instantly (honest, fastest, zero disorientation).
- **No animation on page load** and no on-mount replay; the icon animates only on a
  real theme change.
- No new dependency; the View-Transitions option is documented but unbuilt.

## Revisit triggers

- We build **marketing/landing** pages and want a brand moment → the View-Transitions
  circular reveal is pre-specified above (Option B), fully gated.
- We add **route** transitions → reassess React `<ViewTransition>` / Next's view-transitions
  once they leave experimental; that is a navigation concern, not this one.
- We adopt a motion library (Motion) for other reasons → the icon swap could move to
  its `AnimatePresence initial={false}` idiom (the same skip-on-load intent), but the
  dependency is not worth adding for this alone.

## Sources

**Theme-switch mechanics & the color-transition anti-pattern**

- next-themes — README / source (`disableTransitionOnChange`; the class is applied in
  a `useEffect`, which is why View Transitions need `flushSync`):
  <https://github.com/pacocoursey/next-themes>
- Paco Coursey — "Disabling theme transitions" (the smear/perf rationale next-themes
  links; inject `transition:none`, force reflow, restore):
  <https://paco.me/blog/disable-theme-transitions>
- shadcn/ui — Dark mode (Next) config + the animated-icon pattern:
  <https://ui.shadcn.com/docs/dark-mode/next>, icon rotate/scale detail:
  <https://github.com/shadcn-ui/ui/issues/2237>

**View Transitions API**

- MDN — Using the View Transition API (default crossfade; the circular-reveal
  `clip-path` recipe; `isolation`/`mix-blend-mode` snapshot CSS; feature detection):
  <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using>
- MDN — View Transition API / `Document.startViewTransition()`:
  <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>,
  <https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition>
- web.dev — "Same-document view transitions are now Baseline newly available"
  (2025-10-14; Chrome 111+/Safari 18+/Firefox 144+; Firefox omits _types_):
  <https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available>
- web.dev — View transitions (SPA; reduced-motion gating):
  <https://web.dev/learn/css/view-transitions-spas>
- Chrome — View Transitions (rendering suppressed during the DOM update):
  <https://developer.chrome.com/docs/web-platform/view-transitions/>
- React — `flushSync` (force the class commit inside the transition callback):
  <https://react.dev/reference/react-dom/flushSync>
- React Labs — View Transitions, Activity, and more (experimental; scoped to
  navigation/expand/reorder, not a global class swap):
  <https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more>
- Next.js — view-transitions guide / `next-view-transitions` (route-level, experimental):
  <https://nextjs.org/docs/app/guides/view-transitions>,
  <https://www.npmjs.com/package/next-view-transitions>

**Accessibility & UX**

- W3C — SC 2.3.3 Animation from Interactions (the color/opacity-is-not-motion nuance):
  <https://w3c.github.io/wcag/understanding/animation-from-interactions>
- W3C — SC 2.3.1 Three Flashes or Below Threshold:
  <https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold>
- MDN — `prefers-reduced-motion`:
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- Nielsen Norman Group — The Role of Animation and Motion in UX (motion needs a
  user-centered purpose): <https://www.nngroup.com/articles/animation-purpose-ux/>
- GitHub Primer — theming; Material Design 3 — color; Apple HIG — Dark Mode:
  <https://primer.style/product/getting-started/react/theming/>,
  <https://m3.material.io/styles/color/choosing-a-scheme>,
  <https://developer.apple.com/design/human-interface-guidelines/dark-mode>

**Icon technique — morph vs cross-fade**

- Nielsen Norman Group — Executing UX Animations: Duration and Motion Characteristics
  (100–400ms; toggles ~100ms; too-long is the common failure):
  <https://www.nngroup.com/articles/animation-duration/>
- Material 2 — Animated icons (simple = fade+scale cross-fade; morph = "complex",
  brand-emphasis only): <https://m2.material.io/design/iconography/animated-icons.html>
- Vercel Geist — Theme Switcher (a segmented Light/System/Dark control; "don't rebuild
  it as icon buttons"): <https://vercel.com/geist/theme-switcher>
- GitHub Octicons (render via `currentColor`, instant): <https://primer.style/octicons/code/>
- web.dev — Building a theme switch component (Adam Argyle; the reference mask-based
  sun↔moon **morph**, and instant swap under reduced-motion):
  <https://web.dev/articles/building/a-theme-switch-component>
- `@theme-toggles` (bespoke non-Lucide morph glyphs): <https://toggles.dev/> ·
  `morphicons` (Lucide-geometry morph; JS/spring; reduced-motion off by default):
  <https://github.com/guillermolg00/morphicons>

See [0001](0001-decision-making-methodology.md) (shadcn baseline / deviate-with-evidence),
[0020](0020-ui-foundations-layout-responsiveness-accessibility.md) (motion curve `ease-snappy`,
global reduced-motion), [0023](0023-app-shell-routing-and-boundaries.md) (the ⌘⇧L quick-flip
and theme menu), and [0030](0030-component-animation-base-ui-transitions.md) (the component
animation language this extends).
