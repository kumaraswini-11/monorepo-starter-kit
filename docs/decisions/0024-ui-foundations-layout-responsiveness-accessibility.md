# 0024. UI foundations — layout, responsiveness (mobile → TV) & accessibility

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
at the end. This complements [0014](0014-base-ui-adoption.md) (Base UI adoption /
a11y enforcement) and [0023](0023-nextjs-rendering-and-performance-model.md)
(rendering model).

## Decisions

### 1. Base UI is _behavior_, not _layout_

- **Page layout = CSS/Tailwind**, not Base UI. Base UI ships accessible **unstyled
  primitives** and nothing for page structure (columns, centering, viewport height).
- **Component behaviors we _use_ (never hand-roll):**
  - **`ScrollArea`** — custom cross-browser scrollbars + `data-has-overflow-*` state,
    for **bounded** scroll regions (panels, sidebars, long lists). **Never the page.**
  - **`Dialog`** — reference-counted **scroll-lock** + **focus-trap**
    (`modal: true | false | 'trap-focus'`); handles nested dialogs correctly.
  - **`DirectionProvider`** — RTL behavior (see [0014](0014-base-ui-adoption.md); wired
    with i18n).
  - **`render` prop** — polymorphism (not Radix `asChild`); see [0014](0014-base-ui-adoption.md).

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
  **app** code ([0014](0014-base-ui-adoption.md)). Division of labour: **Base UI** →
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
  ([0014](0014-base-ui-adoption.md)).

### 6. Icons & SVG assets — placement, naming & accessibility

**Placement (reusability boundary — see
[0022](0022-shared-code-and-utilities-organization.md)):**

- **Our brand** (efferd `Logo` / `LogoIcon`) → `apps/web/components/brand/`. It is
  app-specific identity and must not pollute the template-reusable `packages/ui`. The brand
  **name string** is separate from the mark: it lives in `apps/web/lib/brand.ts`
  (`brand.name`) — the single rebrand seam, wired into `metadata`, UI copy, and the marks'
  `aria-label`, so renaming the product is a one-file change while the SVG marks stay here.
  **(Revised 2026-08-16 → both the marks and `brand.ts` move into `@workspace/ui` as this
  product's shared identity — the accepted single "brand" concession in an otherwise
  brand-agnostic library; see
  [0022](0022-shared-code-and-utilities-organization.md) → Component placement.)**
- **Generic / third-party UI icons** (`GoogleIcon`, `GithubIcon` — social-login
  affordances any app reuses) → `packages/ui/src/components/icons/`.
- **Functional glyphs** → **lucide-react** (already a dep, tree-shaken via
  `optimizePackageImports`). Only hand-author an SVG component when lucide lacks it
  (brand marks). Raw `.svg` _asset_ files (if ever) → `public/`, via `next/image`.

**Naming:** kebab-case file mirroring the PascalCase export (`google-icon.tsx` →
`GoogleIcon`), like `password-input.tsx` → `PasswordInput`. The `-icon` suffix is kept
(over a bare `google.tsx`) for grep-ability and file/export mirroring.

**Component standard (every hand-authored SVG):**

- `fill="currentColor"` on the **`<svg>`** (inherit text colour; light/dark adaptive) —
  never on child paths.
- `viewBox` present; **no** `width`/`height` — size-agnostic; the caller sizes via
  `className` (`h-6 w-auto`, or a button's automatic `size-4`).
- `xmlns` present (standalone-serialization-safe; matches lucide's output).
- `props: React.ComponentProps<"svg">` spread **last**, so call sites can override size,
  `data-icon`, or `aria-*`.
- **Accessibility (the point):**
  - **Decorative** (icon paired with visible text, e.g. inside "Continue with Google") →
    **`aria-hidden="true"`** so screen readers do not announce it twice. Default for the
    `icons/` set.
  - **Meaningful** (standalone, conveys info with no adjacent text — the `Logo` is the
    only on-screen "efferd") → **`role="img"` + `aria-label`**; a call site passes
    `aria-hidden` to override when the mark sits beside visible brand text.
  - We omit `focusable="false"` (a legacy-IE workaround) — the stack is modern-only and
    lucide does not emit it either.

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
  ([0014](0014-base-ui-adoption.md)).
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
- SVG icon accessibility (decorative vs meaningful; `currentColor` / `viewBox`):
  <https://dev.to/svgicons/svg-icon-accessibility-decorative-vs-meaningful-icons-2430>,
  <https://koenvangilst.nl/lab/accessible-svgs>

See [0007](0007-base-ui-over-radix.md) (Base UI over Radix),
[0014](0014-base-ui-adoption.md) (Base UI adoption / a11y enforcement),
[0023](0023-nextjs-rendering-and-performance-model.md) (rendering model), and
[../future-improvements.md](../future-improvements.md).
