# 0002. Proprietary license & package-publishing posture

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

monorepo-starter-kit is the foundation for a **private, closed-source product**
that will undergo compliance (e.g. SOC 2 / legal audit) in the future. The repo
may be kept public for reference/showcase. We considered MIT, 0BSD, and the
Unlicense before clarifying this intent.

Separately, the shadcn `next-monorepo` template ships
`packages/typescript-config/package.json` with:

```jsonc
"license": "PROPRIETARY",
"publishConfig": { "access": "public" }
```

(Its `eslint-config` package does **not** — an inconsistency within the template
itself.) Because this repo is expected to go public later, it was tempting to
"complete" this by keeping `publishConfig` and setting `access` to `public` or
`restricted`. This ADR settles both the license and the package-publishing
posture together, since they are frequently confused.

## Decision

### License — proprietary (`UNLICENSED`)

Use a **proprietary** license:

- `"license": "UNLICENSED"` on every `package.json`
- `"private": true` on every package
- An "All rights reserved" proprietary `LICENSE` file

Explicitly **not** MIT/permissive, **not** the open-source `Unlicense`
(public-domain dedication — the opposite of the intent), and **not**
`"PROPRIETARY"` — an invalid npm/SPDX token that SCA/compliance tools flag as
"unknown"; `UNLICENSED` is the correct proprietary token.

### Package-publishing posture — no `publishConfig`

**Remove `publishConfig` entirely.** Every internal package keeps only
`"private": true` + `"license": "UNLICENSED"`. Do not add `publishConfig`
(neither `public` nor `restricted`). This also corrects the template's
`"license": "PROPRIETARY"` → `"UNLICENSED"` (per the token reasoning above).

## Consequences / rationale

- No one may use, copy, or redistribute the code without written permission.
- Reads unambiguously as proprietary to compliance / SCA tooling.
- **`publishConfig.access` only governs publishing a package to the npm
  registry.** It has **nothing to do with GitHub repo visibility or the
  license** — those are two unrelated meanings of "public."
- Every package is **`private: true`**, which blocks npm publishing entirely, so
  `publishConfig.access` is **dead config (a no-op)** whatever its value.
- **"Going public" = making the GitHub source public** (and flipping the license
  to an open one, adding a CLA — see
  [0003](0003-contributing-and-security-docs.md)), **not** publishing packages to
  npm. The `@workspace/*` packages are internal, consumed only inside the
  monorepo via `workspace:*`.
- **If** a package is ever published to npm as an installable library, that is a
  separate, deliberate decision: remove `private: true`, add `publishConfig`,
  and set up versioning (e.g. Changesets).
- **Follow-up:** when the project opens to external contributors, flip the
  license to an open one and add a CLA — see
  [0003](0003-contributing-and-security-docs.md).

Removing `publishConfig` (and correcting the `PROPRIETARY` token) is an
evidence-backed deviation from the shadcn template, per
[0001](0001-decision-making-methodology.md).
