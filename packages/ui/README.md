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

Atoms + agnostic molecules live here (component placement — ADR 0022). See ADRs
[0007](../../docs/decisions/0007-base-ui-over-radix.md) /
[0014](../../docs/decisions/0014-base-ui-adoption.md) (Base UI),
[0024](../../docs/decisions/0024-ui-foundations-layout-responsiveness-accessibility.md) (a11y),
[0026](../../docs/decisions/0026-form-submission-and-pending-state-pattern.md) (forms).
