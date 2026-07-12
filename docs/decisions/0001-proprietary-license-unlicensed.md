# 0001. Proprietary license (`UNLICENSED`)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

monorepo-starter-kit is the foundation for a **private, closed-source product**
that will undergo compliance (e.g. SOC 2 / legal audit) in the future. The repo
may be kept public for reference/showcase. We considered MIT, 0BSD, and the
Unlicense before clarifying this intent.

## Decision

Use a **proprietary** license:

- `"license": "UNLICENSED"` on every `package.json`
- `"private": true` on every package
- An "All rights reserved" proprietary `LICENSE` file

Explicitly **not** MIT/permissive, **not** the open-source `Unlicense`
(public-domain dedication — the opposite of the intent), and **not**
`"PROPRIETARY"` (an invalid npm/SPDX token that SCA tools flag as "unknown").

## Consequences

- No one may use, copy, or redistribute the code without written permission.
- Reads unambiguously as proprietary to compliance / SCA tooling.
- **Follow-up:** when the project opens to external contributors, flip the
  license to an open one and add a CLA — see
  [0006](0006-contributing-security-docs.md).
