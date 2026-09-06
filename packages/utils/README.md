# @workspace/utils

Generic, pure, isomorphic, **zero-dependency** utilities — the leaf of the dependency graph
(imports no other `@workspace/*`; lint-enforced).

## Entry points

Wildcard subpath exports: `@workspace/utils/<module>` (e.g. `@workspace/utils/string` → `firstWord`).
Each helper is generically named, pure, isomorphic, and complexity-optimal — promote something
here only once it's proven generic. See ADR
[0016](../../docs/decisions/0016-shared-code-and-package-boundaries.md).
