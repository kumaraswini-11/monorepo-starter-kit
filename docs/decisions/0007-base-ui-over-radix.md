# 0007. Use Base UI (over Radix) for component primitives

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

shadcn/ui components are built on a headless primitive library — historically
**Radix UI**. Two things changed that:

- **Base UI reached v1.0 stable in December 2025** (now v1.6.x, ~6M weekly
  downloads) and is built by the same engineers who created Radix.
- In **July 2026, shadcn/ui made Base UI the _default_** primitive for new
  projects — the community was already choosing it ~2:1 on `shadcn/create`, and
  the team formalized it.

Radix is **not deprecated**: shadcn still supports it, and components ship for
both libraries (unless a component is Base-UI-only). `shadcn init -b radix` opts
a project back onto Radix.

This repo already reflects the new default — `components.json` uses a `base-*`
style (`base-vega`), and `packages/ui/src/components/button.tsx` imports from
`@base-ui/react`.

## Decision

Use **Base UI** (`@base-ui/react`) as the component primitive layer, matching
shadcn's current default and Base UI's stable status. Add new components with
the default (Base UI), not `-b radix`.

## Consequences

- Aligned with shadcn's actively-developed default direction.
- Base UI is stable (1.x) and safe to depend on.
- **Radix remains an escape hatch** (`shadcn init -b radix`) if a specific
  component exists only on Radix or needs Radix-specific behavior.

Sources: shadcn "Base UI as the Default" changelog and Base UI docs — see
[../references.md](../references.md).
