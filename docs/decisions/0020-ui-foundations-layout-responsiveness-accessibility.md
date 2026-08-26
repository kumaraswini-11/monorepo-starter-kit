# 0020. UI foundations — layout, responsiveness (mobile → TV) & accessibility

- **Status:** Accepted
- **Date:** 2026-08-15

## Context

Before building the auth UI — and every screen after it — we settled the
**codebase-wide** rules for _how screens are laid out_, _how they scale from small
phones up to large-screen TVs_, and _how we keep markup semantic and accessible_.

The trigger was a concrete design question ("how should the auth entry screen be laid
out — viewport height, scroll, responsiveness, cross-browser?"), which the user
broadened to the whole codebase: **every screen we build now or later targets the full
range from mobile to big-screen TVs**, so the conventions are written once, here.

A key clarification shapes this ADR: **Base UI is a _behavior / accessibility_ primitive
library, not a layout system.** It owns component behavior (ARIA, keyboard, focus,
scroll-locking, positioning); **page layout is ours** (CSS/Tailwind + web standards).
Mixing those up is the usual source of layout bugs, so we separate them explicitly.

### How we decided

Base UI official docs (accessibility overview, `ScrollArea`, `Dialog`,
`DirectionProvider`, the `render` prop — via context7 `/mui/base-ui`), the **W3C
WAI-ARIA Authoring Practices Guide (APG)** and **WCAG 2.2**, and current (2026)
responsive-design guidance (container queries, fluid type, readability caps). Sources
at the end. This complements [0021](0021-base-ui-selection-and-adoption.md) (Base UI
selection / adoption / a11y enforcement) and
[0019](0019-nextjs-rendering-and-performance.md) (rendering model).

## Decisions

### 1. Base UI is _behavior_, not _layout_

- **Page layout = CSS/Tailwind**, not Base UI. Base UI ships accessible **unstyled
  primitives** and nothing for page structure (columns, centering, viewport height).
- **Component behaviors we _use_ (never hand-roll):**
  - **`ScrollArea`** — custom cross-browser scrollbars + `data-has-overflow-*` state,
    for **bounded** scroll regions (panels, sidebars, long lists). **Never the page.**
  - **`Dialog`** — reference-counted **scroll-lock** + **focus-trap**
    (`modal: true | false | 'trap-focus'`); handles nested dialogs correctly.
  - **`DirectionProvider`** — RTL behavior (see [0021](0021-base-ui-selection-and-adoption.md); wired
    with i18n).
  - **`render` prop** — polymorphism (not Radix `asChild`); see [0021](0021-base-ui-selection-and-adoption.md).

### 2. Layout & viewport

- **Height: `min-h-svh`** (small-viewport-height; CSS `svh`/`dvh`/`lvh` reached
  **Baseline "widely available" in June 2025**, ~95% support). **Never `h-screen` /
  `100vh`** — it is clipped by mobile browser chrome. `min-h-screen` (100vh) is the
  graceful fallback base; **`dvh` only** for specific sticky-footer cases (it reflows
  as chrome shows/hides → jank).
- **Native document scroll — never `overflow-hidden` a page.** It clips content on
  zoom, short screens, long error states, and translated text. Bounded scrolling uses
  Base UI `ScrollArea`, not a clipped page.
- **Centering:** `min-h-svh flex flex-col items-center justify-center` + responsive
  padding (`p-6 md:p-10`).
- **HTML5 landmarks on every screen:** a single **`<main>`** per page plus
  `<header>` / `<nav>` / `<footer>` / `<section>` as appropriate — the accessibility
  skeleton, not `<div>` soup. (The `(auth)` layout renders `<main>`.)
- **Decorative background layers:** `absolute`, `-z-10`, `pointer-events-none`,
  `aria-hidden`, and guarded by `prefers-reduced-motion` for anything animated.

### 3. Responsive from mobile → big-screen TV (the always-on target range)

Every component and page is designed for the **full range, phone → 4K/TV**:

- **Mobile-first:** small-screen styles are the **base** (no media query); add
  complexity **upward** with `min-width` breakpoints (Tailwind `sm`…`2xl`). Phones
  download the simplest stylesheet.
- **Cap content width for large screens (readability):** text columns ~**50–75
  characters** (`max-w-prose` / `ch`-based caps); forms and cards capped
  (`max-w-sm` / `max-w-md`) and **centered**. Big screens **don't fill — they center**;
  full-width 4K text is unreadable. (~30–50ch on mobile.)
- **Fluid type & spacing** with `clamp()` where it earns its keep; **body text never
  below 16px** (accessibility / mobile zoom).
- **Container queries** (Tailwind v4 `@container`) for **component-level**
  responsiveness independent of the viewport — a component adapts to _its_ space, not
  the window. (`card.tsx` already uses `@container/card-header`.) Prefer these for
  reusable components.
- **Fluid layouts:** grid / flex / relative units — never rigid pixel containers.
- **Target size (touch + TV remote):** **WCAG 2.2 §2.5.8** requires ≥ **24×24px**;
  aim for **44px** on primary actions (finger + D-pad focus).

### 4. Semantic HTML & accessibility

- **Base UI primitives are WAI-ARIA APG + WCAG 2.2 by design.** They render **native
  elements where they exist** (e.g. a trigger is a real `<button>` with
  `aria-expanded` / `aria-haspopup` / `role`) and apply **ARIA roles where no native
  element exists** (menu, combobox, tabs, accordion). We **trust the primitives**; when
  we swap the element via `render` / `nativeButton`, **we** own keeping the result
  semantically valid.
- **shadcn `Card` parts render `<div>` _on purpose_.** `CardTitle` / `CardDescription`
  were deliberately changed **from `<h3>` / `<p>` to `<div>`** so the **page owns its
  heading hierarchy** — a hard-coded `<h3>` produces wrong or skipped heading levels
  out of context (worse for screen readers than a neutral `<div>`). **Consequence:** the
  **developer supplies the real heading element at the correct level** (e.g. the page
  title as `<h1>`, a section title as `<h2>`), via the heading element directly or
  `render`. **One `<h1>` per page; never skip levels for styling.**
- **`jsx-a11y` enforces the _developer's_ duties** (alt text, labels, ARIA misuse) on
  **app** code ([0021](0021-base-ui-selection-and-adoption.md)). Division of labour: **Base UI** →
  primitive a11y; **`jsx-a11y`** → our composition; **this ADR** → page semantics
  (landmarks + headings) that shadcn intentionally leaves to us.

### 5. RTL-aware utilities (logical properties)

- **Standardize on logical Tailwind utilities:** `start-*` / `end-*` (not `left-*` /
  `right-*`), `ps-` / `pe-`, `ms-` / `me-`, `rounded-s-` / `rounded-e-`, `text-start` /
  `text-end`. shadcn's `base-vega` style + `components.json` `rtl: true` already emit
  these, and **every** shadcn component in `packages/ui` uses `start-` / `end-` — so
  app code matches the library.
- The editor's Tailwind-IntelliSense **`suggestCanonicalClasses`** hint (`start-4` →
  `inset-s-4`) is **cosmetic**; we **keep `start-` / `end-`** for consistency with
  shadcn and readability. It is an editor suggestion, not a lint-gate rule. RTL
  _activation_ (`DirectionProvider` + a dynamic `dir`) lands with **i18n**
  ([0021](0021-base-ui-selection-and-adoption.md)).

### 7. Cross-browser input hardening — autofill & Edge native controls (2026-08-16)

Three UA-specific `<input>` behaviours are normalized once in
`packages/ui/src/styles/globals.css` (the design-system layer, so every input inherits them).
Base UI is behaviour-only / unstyled, so these are ours to own in CSS, not the primitive's job.

- **Autofill tint.** Chrome/Edge/Safari/Opera paint autofilled inputs with a yellow/blue
  background and lock `background-color` (UA `!important`). We override with the standard
  **inset box-shadow trick** — `-webkit-box-shadow: 0 0 0 1000px var(--background) inset` +
  `-webkit-text-fill-color: var(--foreground)` + `caret-color` — so autofilled fields match the
  theme in light and dark. The focus **border** (`focus-visible:border-ring`) still shows; only
  the ring _glow_ is replaced while a field is autofilled (fine — the border is a valid focus
  cue). Firefox applies no such tint, so no rule is needed there. _Limitation:_ the inset uses
  `--background`; an input on a differently-coloured surface (e.g. a card) may need a
  per-context override — none exist today (auth inputs sit on `--background`).
- **Edge/IE native password-reveal + clear.** `::-ms-reveal` (password eye) and `::-ms-clear`
  (clear "×") render only in Edge/IE. Since we ship our own accessible show/hide toggle
  (`PasswordInput`), `::-ms-reveal` **duplicated** our eye in Edge — we `display: none` both,
  matching Chrome/Firefox (which render neither), per Microsoft's own guidance. _Trade-off:_
  this also drops Edge's clear-"×" on plain text inputs (intentional, for cross-browser
  consistency; scope to `input[type="password"]` if a text-input clear is ever wanted).
- **Disabled controls** already carry `disabled:pointer-events-none` via the shadcn
  `Button`/`Input`, and `globals.css` gives only _enabled_ buttons `cursor: pointer` — so a
  disabled control is inert with no interactive cursor. No change needed.

## Further UI conventions

Two smaller, reusable conventions. None touches a vendored shadcn primitive — they live in
our own components.

### Control sizing — one size per header/toolbar row

Icon controls in a row share **one** size for optical rhythm. The header uses **`icon-sm`
(32px)** across the sidebar trigger, theme toggle, and account-menu button (the avatar fills
that button). shadcn's defaults differ (`SidebarTrigger` = `icon-sm`/32, a plain icon `Button` =
36), so we align our controls **to** the trigger rather than editing the primitive (0001); 32px
still meets the WCAG 2.5.8 target minimum. `SidebarTrigger` also accepts a `size` override via
props if a row wants the larger size — still no primitive edit.

### Action-color semantics — destructive is reserved for irreversible loss

`variant="destructive"` (on `Button` / `DropdownMenuItem`) is used **only** for actions that
cause irreversible loss (delete account, revoke a key, remove a member). **Reversible** actions,
including **Sign out**, use the **default** variant (keep a leading icon for scanability). Red is
a scarce signal — spending it on a safe, high-frequency action both alarms users and desensitises
them, so genuine destructive red stops meaning "stop." (Sign-out was initially prototyped
destructive; changed on review.)

## Consequences

- Every screen gets: **`<main>` + landmarks**, **`min-h-svh`**, **native scroll**
  (no page `overflow-hidden`), **capped + centered** content, **mobile-first**
  responsiveness that holds from phone to TV, and **real headings**.
- The `(auth)` layout and entry screen already apply this baseline (`min-h-svh`,
  `<main>`, no `overflow-hidden`, `max-w-sm` column, a real `<h1>`, and `currentColor`
  brand/icons sized by the caller).
- Base UI's a11y is **trusted at the primitive level**; our composition is **linted**
  (`jsx-a11y`) and **must add** the page-level semantics (landmarks, heading levels)
  that shadcn deliberately omits.
- Layout and behavior stay cleanly separated: **CSS/Tailwind** for structure, **Base
  UI** for component behavior — so neither fights the other.

## Revisit triggers

- **i18n / an RTL locale** → mount `DirectionProvider` + dynamic `dir`
  ([0021](0021-base-ui-selection-and-adoption.md)).
- **Content / marketing pages** → a fluid type scale + SEO (`opengraph-image`,
  JSON-LD) — see [../future-improvements.md](../future-improvements.md).
- **A genuinely huge-screen product** (kiosk / native TV app) → add a breakpoint
  beyond Tailwind `2xl` or a dedicated container-query scale (content caps handle
  today's range without it).
- **Automated a11y testing** (axe-core / Playwright) → add to CI (testing backlog in
  [../future-improvements.md](../future-improvements.md)).

## Sources

- Base UI — Accessibility overview: <https://base-ui.com/react/overview/accessibility>
- Base UI — `ScrollArea`, `Dialog` (modal / scroll-lock), `DirectionProvider`, `render`
  prop (context7 `/mui/base-ui`).
- W3C — WAI-ARIA Authoring Practices Guide (APG): <https://www.w3.org/WAI/ARIA/apg/>;
  WAI-ARIA overview: <https://www.w3.org/WAI/standards-guidelines/aria/>
- W3C — WCAG 2.2 (Target Size §2.5.8): <https://www.w3.org/TR/WCAG22/>
- shadcn/ui — Card (`CardTitle`/`CardDescription` as `<div>`; heading-hierarchy
  rationale) and discussion #5384: <https://ui.shadcn.com/docs/components/base/card>,
  <https://github.com/shadcn-ui/ui/discussions/5384>
- Viewport units `svh`/`dvh`/`lvh` (Baseline June 2025): MDN / web.dev viewport-units
  guidance.
- Responsive 2026 — container queries, fluid type `clamp()`, readability caps:
  <https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/>,
  <https://belovdigital.agency/blog/designing-for-different-screen-sizes-best-practices/>
- Autofill styling (`:autofill` + inset box-shadow trick): MDN
  <https://developer.mozilla.org/en-US/docs/Web/CSS/:autofill>, CSS-Tricks
  <https://css-tricks.com/almanac/pseudo-selectors/a/autofill/>
- Edge password-reveal (`::-ms-reveal` / `::-ms-clear`): Microsoft Learn
  <https://learn.microsoft.com/en-us/microsoft-edge/web-platform/password-reveal>, Stefan
  Judis <https://www.stefanjudis.com/snippets/how-to-hide-microsoft-edges-password-reveal-button/>
- Material 3 — color roles (destructive / error semantics):
  <https://m3.material.io/styles/color/roles>
- Apple Human Interface Guidelines — buttons:
  <https://developer.apple.com/design/human-interface-guidelines/buttons>

See [0021](0021-base-ui-selection-and-adoption.md) (Base UI — selection & adoption),
[0019](0019-nextjs-rendering-and-performance.md) (rendering model), and
[../future-improvements.md](../future-improvements.md).
