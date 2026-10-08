# `@workspace/eslint-config`

Shared ESLint 10 flat configs for every workspace package (ADR
[0005](../../docs/decisions/0005-lint-gate-and-vendored-exception.md),
[0033](../../docs/decisions/0033-toolchain-version-policy-and-2026-10-modernization.md)).

| Entry                                     | Export                                   | For                                        |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `@workspace/eslint-config/base`           | `config`, `core`, `ignores`, `typeAware` | Node / isomorphic packages                 |
| `@workspace/eslint-config/react-internal` | `config`, `react`, `typeAware`           | React libraries (`packages/ui`, Storybook) |
| `@workspace/eslint-config/next-js`        | `nextJsConfig`, `typeAware`              | Next.js apps                               |

Each exported `config` ends with `eslint-config-prettier/flat` (Prettier owns formatting — ADR
0004); `core` / `react` are the same rule sets without it, for layering. Consumers:

```js
import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([
  ...config,
  typeAware(import.meta.dirname) /* overrides */,
]);
```

What is in `core`: `@eslint/js` recommended, typescript-eslint `recommendedTypeChecked`
(type-aware; `typeAware()` pins the project root), `eslint-plugin-turbo` (undeclared env vars
are errors), type-only import discipline (`verbatimModuleSyntax`), the `process.env` choke-point
rule (ADR 0013) and the `@workspace/*/src/**` deep-import ban (ADR 0016). `react` adds
`@eslint-react` (`recommended-typescript`), `eslint-plugin-react-hooks` (React Compiler
rules) and `@shadcn/lint` (design-system usage: variants over `className` overrides, theme
tokens over raw values — ADR 0038; the policy object `designSystemPolicy` holds the
contracts); `next-js` adds the Next plugin (recommended + core-web-vitals) and jsx-a11y.

Plugins are runtime `dependencies` of this package (consumers resolve them through it).
