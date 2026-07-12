# References

Curated links and sources used while building monorepo-starter-kit, grouped by
use case. Add new links under the relevant section (or make a new one).

## Templates this repo is built from / compared against

- **shadcn `next-monorepo` template** (our baseline) —
  <https://github.com/shadcn-ui/ui/tree/main/templates/next-monorepo>
- **shadcn monorepo docs** — <https://ui.shadcn.com/docs/monorepo>
- **shadcn `components.json` schema** (valid fields: `style`, `rtl`, `menuColor`,
  …) — <https://ui.shadcn.com/schema.json>
- **create-turbo `basic` example** (Turborepo team's reference; source for
  root-level Prettier + `--max-warnings 0`) —
  <https://github.com/vercel/turborepo/tree/main/examples/basic>

## UI primitives (Base UI / Radix)

- **shadcn "Base UI as the Default"** (July 2026 changelog — new projects
  default to Base UI; Radix still supported via `-b radix`) —
  <https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default>
- **Base UI** — headless primitives; v1.0 stable Dec 2025, now v1.x
  (`@base-ui/react`), built by the ex-Radix team —
  <https://base-ui.com/>
- **Radix UI** — still supported by shadcn (`shadcn init -b radix`) —
  <https://www.radix-ui.com/>

## Turborepo

- Docs — <https://turborepo.dev/docs>
- Configuring tasks / Root Tasks (`//#` prefix) —
  <https://turborepo.dev/docs/crafting-your-repository/configuring-tasks>

## Prettier

- CLI (`--check`, `--cache`, `--cache-strategy`) — <https://prettier.io/docs/cli>

## pnpm

- Settings (`allowBuilds`, the pnpm 10.26+/11 replacement for
  `onlyBuiltDependencies`) — <https://pnpm.io/settings>

## ESLint / TypeScript versions

- ESLint v10 release — <https://eslint.org/blog/2026/02/eslint-v10.0.0-released/>
- typescript-eslint dependency/version support —
  <https://typescript-eslint.io/users/dependency-versions/>
- Announcing TypeScript 7.0 (Go-native compiler) —
  <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>

## Future considerations / tooling to watch

Not adopted now — revisit as the ecosystem matures.

- **ESLint 10 & TypeScript 7** — deliberately deferred; see
  [decisions/0004](decisions/0004-defer-typescript-7.md) for the revisit
  triggers (plugin/ecosystem readiness).
- **oxlint** (Oxc) — Rust linter, ~50–100× faster than ESLint (v1.0, Jun 2025);
  linting-only with fewer rules/plugins. Useful as a fast CI correctness pass
  _alongside_ ESLint — <https://oxc.rs/>
- **Biome** — Rust all-in-one linter + formatter (v2, Jun 2025; added type-aware
  rules). A potential single-tool ESLint + Prettier replacement —
  <https://biomejs.dev/>

## Community & security docs

- CONTRIBUTING template (nayafia) —
  <https://github.com/nayafia/contributing-template>
- awesome-contributing — <https://github.com/mntnr/awesome-contributing>
- CONTRIBUTING.md generator (interactive builder) —
  <https://contributing.md/generator/>
- SECURITY.md template (Eclipse CSI security-handbook) —
  <https://github.com/eclipse-csi/security-handbook/blob/main/templates/SECURITY.md>
- Contributor Covenant (Code of Conduct) —
  <https://www.contributor-covenant.org/>

## Decision-record format

- ADR (Architecture Decision Records) — <https://adr.github.io/>
- MADR (Markdown ADR) template — <https://github.com/adr/madr>

## License research

- Choose a License — <https://choosealicense.com/>
- 0BSD — <https://choosealicense.com/licenses/0bsd/>
- The Unlicense — <https://unlicense.org/>
- `UNLICENSED` vs `Unlicense` (npm proprietary token vs open-source license) —
  <https://docs.npmjs.com/cli/v10/configuring-npm/package-json#license>
