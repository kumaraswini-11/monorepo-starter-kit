import { defineConfig } from "taze";

/**
 * taze config — the dependency-update CLI, run via `pnpm deps:check` (`taze -r`).
 *
 * taze 20/21 turned on two file rewrites by default that conflict with this repo's policies, so
 * we opt out of both (applies to every invocation, not just the script):
 *
 * - `nodeVersion: false` — taze 21 rewrites the Node pin in `.nvmrc` / `package.json`. We
 *   deliberately track the Node LTS we actually run (24) and bump it WITH the runtime, never
 *   ahead of it (see AGENTS.md and the `@types/node` note in pnpm-workspace.yaml). taze must not
 *   touch it.
 * - `githubActions: false` — taze 20 rewrites action refs in `.github/workflows/*`. Dependabot
 *   already owns the `github-actions` ecosystem (SHA-pinned, weekly, `.github/dependabot.yml`),
 *   so letting taze rewrite them too would fight that single owner (ADR 0009).
 *
 * This keeps `taze -r` scoped to npm dependencies + the pnpm catalog — its original job.
 */
export default defineConfig({
  nodeVersion: false,
  githubActions: false,
});
