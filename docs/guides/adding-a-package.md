# Adding a package

Governing decisions: [0016](../decisions/0016-shared-code-and-package-boundaries.md) (what belongs
in a package), [0026](../decisions/0026-choosing-the-right-abstraction.md) (when it is too early),
[0036](../decisions/0036-package-boundaries-dead-code-and-scaffolding.md) (scaffold + boundaries).

## 1. Decide whether it should exist

A package earns its place when it has **one purpose** and a **second consumer** (or is a
deliberate port/adapter seam such as `db`, `email`). Uncertain shared code waits in the app.

## 2. Scaffold it

```bash
pnpm gen package
# or non-interactively (name, kind, tag, description):
pnpm gen package --args billing node domain "Billing domain logic"
pnpm install
```

Kinds: `node` (base preset, Node unit tests) or `react` (react-library preset, jsdom tests).
Tags (Boundaries, dependency direction): `leaf` → `domain` → `ui` → apps; `config` for presets.

The generator emits: `package.json` (`@workspace/<name>`, `private`, `UNLICENSED`, source-only
`exports`, `catalog:`/`workspace:` deps), `tsconfig.json`, `eslint.config.js`,
`vitest.config.ts`, `turbo.json` (tag), `README.md`, `src/index.ts`, `src/index.test.ts`.

## 3. Wire it

- Consumer: add `"@workspace/<name>": "workspace:*"` to the consuming package's manifest.
- Public surface: every public entry is a subpath in `exports`; everything else stays private.
  Import your own modules by package name (`@workspace/<name>/...`), never by `paths`.
- Server-only code: `import "server-only"` at the top of modules that must never reach a
  client bundle (ADR 0016).
- Env: read configuration through `@workspace/env`, never `process.env` (ADR 0013).

## 4. Verify

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm knip
pnpm exec turbo boundaries
```

## Removing a package

Delete the directory, remove its `workspace:*` references, run `pnpm install` (the lockfile
drops its importer), then `pnpm knip` (unused catalog entries) and the gate.
