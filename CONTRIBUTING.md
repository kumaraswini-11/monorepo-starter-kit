# Contributing

This is a private, proprietary repository (ADR [0002](docs/decisions/0002-proprietary-license-and-package-posture.md)).
Contributions come from people with write access; the workflow below is the engineering
standard for every change, large or small. Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Before you start

- Read [AGENTS.md](AGENTS.md) (the lean handbook — it applies to humans too) and the guide for
  what you are doing in [docs/guides/](docs/guides/).
- A change that alters a convention, a tool, or a boundary needs an **ADR** in
  [docs/decisions/](docs/decisions/) (copy the latest record's format; add an index row). Open
  an issue (feature form) first if the decision is not obvious — align before building.
- Trivial fixes (typos, comments) can go straight to a pull request.

## Setup

```bash
pnpm install          # pnpm 11 pins itself and the Node runtime; installs the git hooks
cp apps/web/.env.example apps/web/.env.local && docker compose up -d
pnpm dev
```

Inside the repo use `pnpm` / `pnpm dlx` only (never `npm` / `npx`).

## The loop

1. **Branch** from `main`: `type/short-description` (e.g. `feat/user-settings`, `fix/button-focus`).
2. **Change** the smallest thing that is complete. New package → `pnpm gen package`. New
   dependency → `pnpm add --filter <pkg> --catalog <dep>` and read its docs (ADR 0034).
3. **Gate locally** (the hooks format and lint staged files on commit; the full gate is yours):

   ```bash
   pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm knip && pnpm licenses:check
   ```

   Plus `pnpm test:integration` / `pnpm test:e2e` / `pnpm exec turbo run build:storybook test --filter=storybook`
   when you touched what they cover (CI runs them anyway).

4. **Audit your diff** before committing (AGENTS.md "Audit before every commit"): standards,
   DRY/SOLID, compatibility with the involved libraries' official docs, error paths, cleanup,
   security.
5. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/) — enforced by
   the `commit-msg` hook: `feat(auth): add passkey step`, `build(deps): bump drizzle-orm`.
   One logical change per commit.
6. **Pull request** against `main`: fill the template; the title must be a Conventional
   Commit (it becomes the squash commit). CI must be green: format, lint, typecheck, build,
   knip, licence policy, audit, tests, Storybook, CodeQL, dependency review, PR title.
7. **Review & merge**: squash only, linear history (ruleset). Resolve every conversation.

## Reporting

- **Bugs / proposals**: GitHub issues via the forms (`bug`, `feature`).
- **Security**: never a public issue — follow [SECURITY.md](SECURITY.md).

## Where things go

| Question                                    | Answer                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Shared, generic UI?                         | `packages/ui` (ADR 0016/0026); feature UI stays in `apps/web/features/<name>/` (ADR 0028)               |
| Server-side capability (data, auth, email)? | its own `packages/<name>` with `server-only`, behind a port (ADR 0012/0014/0016)                        |
| Configuration / secrets?                    | `@workspace/env` schema + `apps/<app>/.env.example` (ADR 0013)                                          |
| Tests?                                      | co-located with the code; tiers and runners in the [testing guide](docs/guides/testing.md)              |
| A decision?                                 | an ADR; deferred work goes to [docs/future-improvements.md](docs/future-improvements.md) with a trigger |
