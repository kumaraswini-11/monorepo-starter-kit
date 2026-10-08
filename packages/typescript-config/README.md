# `@workspace/typescript-config`

Shared TypeScript 6 presets (ADR
[0033](../../docs/decisions/0033-toolchain-version-policy-and-2026-10-modernization.md)). Every
workspace package extends exactly one of them; there is no `paths` aliasing between packages
(ADR [0036](../../docs/decisions/0036-package-boundaries-dead-code-and-scaffolding.md)).

| Preset               | Extends | For                        | Key settings                                                                                                                                                                                            |
| -------------------- | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.json`          | —       | Node / isomorphic packages | `module` + `moduleResolution: NodeNext`, `target`/`lib` es2024, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`, `types: ["node"]`, `noEmit` |
| `react-library.json` | base    | React libraries, Storybook | adds `lib: dom`, `jsx: react-jsx`                                                                                                                                                                       |
| `nextjs.json`        | base    | Next.js apps               | adds `lib: dom`, `module: ESNext` + `moduleResolution: Bundler`, `jsx: preserve`, `allowJs`, the `next` language-service plugin                                                                         |

Why these choices (short form; the ADR has the reasoning): `NodeNext` keeps import specifiers
runtime-correct for Node-run packages; `Bundler` is what Next/Turbopack resolve with;
`verbatimModuleSyntax` makes type-import elision deterministic for every single-file transpiler;
`erasableSyntaxOnly` keeps the code runnable by Node's type-stripping; `types` is explicit
because TypeScript 6 no longer auto-includes `@types/*`; nothing emits (packages are
source-only), so `declaration*` is off.

Per-package overrides are rare and documented inline (e.g. `packages/utils` sets `types: []`
because it is an isomorphic leaf).
