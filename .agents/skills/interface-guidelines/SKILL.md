---
name: interface-guidelines
description: Concrete, checkable UI rules for this repo — border-radius, animation, typography, colour tokens, accessibility, layout, and UI copy. Use when building, reshaping, or reviewing any UI (components in @workspace/ui or app screens), or when the user asks for a UI/design-quality pass. Pairs with the frontend-design skill (aesthetic direction) as the implementation-rules layer.
---

> **Local, hand-authored skill** — not vendored via the skills CLI, so it is
> **not** in `skills-lock.json`; a re-install won't recreate or remove it. Source
> of truth is this file, reviewed in git like code (adoption policy: ADR 0011).
> Distilled and adapted from the interfaces.dev cheat-sheet
> (<https://interfaces.dev/cheat-sheet>, Jakub Krehel) and cross-checked against
> our own conventions. Keep it in sync when our ADRs change.

# Interface guidelines

A repo-specific checklist that turns "make the UI better" into concrete,
verifiable decisions. Two companion skills:

- **`frontend-design`** — aesthetic direction (palette, type pairing, signature,
  distinctiveness). Reach for it when _deciding what the design should be_.
- **this skill** — the implementation rules that make any direction correct and
  accessible. Reach for it when _building or reviewing the UI_.

Our stack context: **Tailwind v4 + shadcn/ui on Base UI** (ADR 0007/0014),
**OKLCH semantic tokens**, **react-hook-form** form layer (ADR 0025/0026), a11y
lint via `eslint-plugin-jsx-a11y` (ADR 0014/0024). Where a rule below is already
enforced by tooling or a shared component, the note says so — don't hand-roll it.

## User interface

- **Concentric radius** on nested rounded elements: the inner radius = outer
  radius − padding, so corners stay parallel. (Tailwind: derive with the radius
  scale, don't eyeball.)
- Align **optically**, not geometrically — icons and glyphs often need a nudge to
  _look_ centred even when the box is centred.
- Give content images a hairline edge: `1px` outline offset `-1px`, black at 8%
  opacity in light mode / white at 8% in dark. Skip for decorative/brand art.

## Animation

- **Never `transition: all`** — name the exact properties. (Cheap to lint for in
  review.)
- Press feedback: scale buttons to `0.95`–`0.98` on `:active`, `transition: scale
  200ms ease-out`.
- Cross-fade swapped icons: entering scales `0.25→1`, opacity `0→1`, blur
  `4px→0`; exiting reverses.
- **Transitions for interactions** (interruptible); **keyframes for one-shot
  sequences**.
- **Kill transitions during theme switch** (light↔dark) so tokens don't animate.
- `will-change` only for what actually animates (`transform`, `opacity`,
  `filter`) — and remove it after. A stray 1–2px shift on iOS Safari? add
  `will-change: transform` to the animating element.
- Stagger entrances by group/element. **Don't** animate high-frequency states
  (e.g. per-row hover colour in a list).
- **Always** gate motion behind `@media (prefers-reduced-motion: no-preference)`.

## Typography

- Web fonts: **`.woff2` only**, never `.ttf`/`.otf`.
- `font-variant-numeric: tabular-nums` on **every changing value** and in tables
  (timers, counters, prices, data columns). Skip under a monospace face.
- Long-form measure: **60–75 characters** per line.
- `text-wrap: balance` on headings, `text-wrap: pretty` on descriptions,
  **neither** in long-form body.
- `overflow-wrap: break-word` where long words/links/IDs can overflow;
  `white-space: nowrap` on labels and badges.
- `-webkit-font-smoothing: antialiased` + `-moz-osx-font-smoothing: grayscale`
  **once on the root**, never per component.
- Store copy in **natural case**; present with `text-transform`.
- **Smart punctuation**: curly quotes, en dash for ranges, em dash for asides,
  the single `…` character.
- `text-underline-position: from-font` + `text-decoration-skip-ink: auto` so
  underlines clear descenders.
- **Truncated text keeps the full value reachable** (tooltip or expanded view).

## Colour (OKLCH semantic tokens)

- **Every palette step earns a role** (page bg, hover, border, solid fill, body
  text). Don't add steps nothing uses.
- Components use **semantic tokens** (`--color-text-secondary`), never primitives
  (`--blue-500`). Primitive = raw value; token = how it's used.
- **Never name a token for its appearance or first use**: `--color-accent-solid`,
  not `--color-blue-button` / `--color-sidebar-gray`.
- Reserve `accent` for the **brand colour** so `primary` never means both brand
  and body text.
- **Don't borrow a token from another role** just because the colour matches —
  add a token for the new role, or it breaks when that role's colour changes.
- Measure contrast against the surface the element **actually renders on**, not
  the page background.
- **Dark mode is not light reversed** — it's its own palette.
- One theme mechanism only: `prefers-color-scheme` **or** a `.dark` class, used
  for every token. (This repo uses class-based theming — match it.)
- Gradient interpolation: `in oklab` for even brightness, `in oklch` for vivid
  mid-tones; omit for the sRGB fallback.

## Accessibility (ADR 0024; jsx-a11y catches the basics — these go beyond it)

- **Native semantics**: `<button>` for actions, `<a>` for navigation — never a
  `<div>` with an onClick when a native element fits.
- Style `:focus-visible`; never `outline: none` without a replacement.
- Only `tabindex="0"` / `tabindex="-1"` — positive values break tab order.
- Icon-only buttons get a descriptive `aria-label`; never `aria-hidden` on a
  focusable element.
- **Alt text by purpose**: `alt="Search"` on a search button, not
  `alt="magnifying glass"`. Decorative → `alt=""`.
- Every input: real `<label>`, correct `type`, and `inputmode`. (Our
  `FormTextField`/`FormPasswordField` wire label + error associations — use them,
  ADR 0026.)
- **Never block paste** (passwords, OTPs).
- A tooltip on a `disabled` control never opens for keyboard/touch. Put the
  reason in visible text, or use `aria-disabled="true"` to keep it focusable.
- **Keep submit enabled** until the request starts, then validate on submit:
  `aria-invalid="true"`, `aria-describedby` → the error, focus the first invalid
  field. (This is exactly our RHF form pattern — ADR 0026; don't disable-until-valid.)
- Hit areas: ≥`24×24px`, `44×44px` on touch, `40×40px` on desktop; extended hit
  areas must not overlap.
- `pointer-events: none` on decorative glows/gradients so they don't eat clicks.
- Put hover styling behind `@media (hover: hover)` — on touch, `:hover` sticks
  after a tap.
- `role="status"` for routine updates, `role="alert"` only for urgent errors.
- **Status is never colour alone** — pair with icon, label, or shape.
- Skip-to-content link is the first focusable element; add `scroll-margin-top` on
  anchored headings.

## Layout

- Gap between groups ≥ **2×** the gap within a group (e.g. `8px` within, `16px`+
  between).
- **Logical properties** (`margin-inline-start`, `padding-inline-end`), not
  physical left/right — keeps RTL correct.
- No fixed widths/heights on text containers.

## UI writing (see also frontend-design's writing section)

- Button labels **start with a verb**: "Save draft", "Delete project" — never
  "OK!" or a bare "Yes".
- **Repeat the consequence** in confirmation buttons: "Delete project" beside
  "Cancel".
- **One word per flow**: "Continue" _or_ "Next", never both.
- Link text **describes the destination**: "Read docs", never "Click here".
- Capitalise buttons/headings/labels the **same way everywhere** — sentence case
  is the safer default here.
- Label toggles with **the state they turn on**: "Send read receipts", not
  "Disable read receipts".
- Empty states **orient + offer one next action**, not just "No results".
- Address the reader as **"you"**, not "the user".

## Using this in review

When asked for a UI/quality pass, walk the diff against the sections above and
report concrete, quoted findings (file + rule). Skip anything Prettier/ESLint
already enforces, and defer to a documented repo standard or shared component
wherever one exists.
