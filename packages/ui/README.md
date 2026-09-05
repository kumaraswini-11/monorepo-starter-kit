# @workspace/ui

The shared **design system** — shadcn/ui on Base UI, Tailwind v4, OKLCH tokens. **Source-only**
(no build step): consumed directly via its `exports`; unused components cost nothing (tree-shaken).

## Entry points

| Import                                           | What                                                    |
| ------------------------------------------------ | ------------------------------------------------------- |
| `@workspace/ui/components/*`                     | primitives + form molecules (shadcn/Base UI, RHF-bound) |
| `@workspace/ui/lib/*`                            | utilities (`cn`, `brand`, …)                            |
| `@workspace/ui/hooks/*`                          | shared hooks                                            |
| `@workspace/ui/globals.css` · `./postcss.config` | Tailwind entry + PostCSS config                         |

Atoms + agnostic molecules live here (component placement — ADR 0016). See ADRs
[0021](../../docs/decisions/0021-base-ui-selection-and-adoption.md) /
[0021](../../docs/decisions/0021-base-ui-selection-and-adoption.md) (Base UI),
[0020](../../docs/decisions/0020-ui-foundations-layout-responsiveness-accessibility.md) (a11y),
[0022](../../docs/decisions/0022-forms-rhf-submission-and-pending.md) (forms).
