# 0008. No `publishConfig` on internal packages (npm publishing ≠ repo visibility)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The shadcn `next-monorepo` template ships
`packages/typescript-config/package.json` with:

```jsonc
"license": "PROPRIETARY",
"publishConfig": { "access": "public" }
```

(Its `eslint-config` package does **not** — an inconsistency within the template
itself.) Because this repo is expected to go public later, it was tempting to
"complete" this by keeping `publishConfig` and setting `access` to `public` or
`restricted`.

## Decision

**Remove `publishConfig` entirely.** Every internal package keeps only
`"private": true` + `"license": "UNLICENSED"`. Do not add `publishConfig`
(neither `public` nor `restricted`).

## Consequences / rationale

- **`publishConfig.access` only governs publishing a package to the npm
  registry.** It has **nothing to do with GitHub repo visibility or the
  license** — those are two unrelated meanings of "public."
- Every package is **`private: true`**, which blocks npm publishing entirely, so
  `publishConfig.access` is **dead config (a no-op)** whatever its value.
- **"Going public" = making the GitHub source public** (and flipping the license
  — see [0001](0001-proprietary-license-unlicensed.md)), **not** publishing
  packages to npm. The `@workspace/*` packages are internal, consumed only
  inside the monorepo via `workspace:*`.
- Also corrected the template's `"license": "PROPRIETARY"` → `"UNLICENSED"`:
  `PROPRIETARY` is not a valid npm/SPDX token and is flagged as "unknown" by
  SCA/compliance tools; `UNLICENSED` is the correct proprietary token
  ([0001](0001-proprietary-license-unlicensed.md)).
- **If** a package is ever published to npm as an installable library, that is a
  separate, deliberate decision: remove `private: true`, add `publishConfig`,
  and set up versioning (e.g. Changesets).

This is an evidence-backed deviation from the shadcn template, per
[0005](0005-follow-shadcn-baseline.md).
