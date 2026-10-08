# 0035. Task-graph correctness & affected CI — transit nodes, build-time env, `--affected`

- **Status:** Accepted (amends the `turbo.json` guidance in [0013](0013-env-and-secrets-management.md) and [0025](0025-testing-strategy.md))
- **Date:** 2026-10-07
- **Amended:** 2026-10-08 — `build.env` also declares `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: the static `/auth` shell bakes in whether "Continue with Google" renders, so a build with and without the provider must not share a cache entry. The e2e job sets placeholders for the build (the harness sets the same for the server).

## Context

Our internal packages are **just-in-time** (source-only, consumed as TypeScript — [0016](0016-shared-code-and-package-boundaries.md)).
In that model Turborepo hashes a task from its own package's inputs plus the hashes of the tasks
it `dependsOn`. The audit found two places where that was wrong:

1. **`test` had no `dependsOn` at all** (0025 §4 reasoned "our packages are source-only, so no
   build dependency" — true, but it also dropped the _source_ dependency). A cached `web#test`
   therefore survived a change in `packages/ui`: a stale pass. `build:storybook` had the same
   gap for the stories it reads from `packages/ui`.
2. **`BETTER_AUTH_URL` feeds `metadataBase`** in the root layout, which is prerendered at build
   under Cache Components — yet it sat only in `globalPassThroughEnv`, which by definition does
   not contribute to the cache key (0013 assumed every runtime var was runtime-only).

CI ran every task for every package on every pull request (no affected filtering), with the
setup block copy-pasted into four jobs.

## Decision

1. **Transit node.** `topo: { dependsOn: ["^topo"] }` and `lint`, `typecheck`, `test`,
   `build:storybook` depend on `topo`. A transit node has no script; it exists so each task's
   hash includes its dependencies' inputs — the pattern from Turborepo's TypeScript guide ("run
   in parallel while respecting source code changes from other packages"). It replaces the
   serial `^lint` / `^typecheck` chains with the same correctness and more parallelism.
2. **Build-time env is hashed.** A variable that can change a task's _output_ goes in that
   task's `env`; runtime-only secrets stay in `globalPassThroughEnv`. Today: `build.env` =
   `["BETTER_AUTH_URL"]`. `turbo/no-undeclared-env-vars` is an error so an undeclared read is
   caught at lint time.
3. **`build.outputs` excludes `.next/dev/**`** (Next 16 isolated dev output), per the current
   Turborepo/Next example.
4. **Affected runs on pull requests.** CI passes `--affected` on `pull_request` (base ref
   auto-detected on GitHub Actions; full history checkout; `futureFlags.githubActionsRemoteBaseRefFallback`),
   runs everything on `main` and in the merge queue, and uses
   `--continue=dependencies-successful` so one failure does not hide the others.
5. **One setup definition.** A local composite action (`.github/actions/setup`) does pnpm +
   Node + store cache + frozen install for every job (GitHub's documented mechanism for
   de-duplicating steps).
6. **Deprecated-for-3.0 flags are not used** (`--parallel`, `turbo-ignore`, `daemon`,
   `TURBO_REMOTE_ONLY`, `--graph` images); `$schema` points at `turborepo.dev`.

## Consequences

- **Positive:** cache hits are now trustworthy; CI cost on a PR scales with the change, not the
  repo; adding a job costs three lines.
- **Negative / accepted:** `fetch-depth: 0` on PR checkouts (needed for the diff; cheap at this
  size — revisit with `turbo query affected` + a shallow base fetch if history grows large);
  `--affected` is skipped for root tasks (`//#format`, `//#typecheck:tooling`), which stay full.
- **Remote cache** remains opt-in (Vercel Remote Cache via OIDC, or a self-hosted server through
  the open API) — see the CI guide; enable `remoteCache.signature` when it is turned on.

## References

- Turborepo TypeScript guide (transit nodes): <https://turborepo.dev/docs/guides/tools/typescript>
- Task configuration, `env` vs `passThroughEnv`: <https://turborepo.dev/docs/reference/configuration>,
  <https://turborepo.dev/docs/crafting-your-repository/using-environment-variables>
- `--affected`, CI: <https://turborepo.dev/docs/reference/run>, <https://turborepo.dev/docs/crafting-your-repository/constructing-ci>,
  <https://turborepo.dev/docs/guides/ci-vendors/github-actions>
- GitHub composite actions: <https://docs.github.com/en/actions/sharing-automations/avoiding-duplication>
