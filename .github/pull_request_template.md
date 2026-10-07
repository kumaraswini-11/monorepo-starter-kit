# Pull Request

## Summary

<!-- What does this change do, and why? Link related issues, e.g. "Closes #123". -->

## Type of change

<!-- Mirrors Conventional Commit types — check all that apply. The PR title must be a valid
     Conventional Commit: it becomes the squash-merge commit on main. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` — no behaviour change
- [ ] `build` / `ci` / `chore` — tooling, dependencies, or pipeline
- [ ] `test` — adding or fixing tests

## How was this tested?

<!-- How did you verify it? Added tests, manual steps, screenshots for UI, etc. -->

## Checklist

- [ ] The full gate is green locally: `pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm knip`
- [ ] Dependency changes: added via the catalog (`pnpm add --filter <pkg> --catalog <dep>`), changelog read, not blind-merged
- [ ] Added or updated tests where it makes sense
- [ ] Docs updated: an ADR in `docs/decisions/` if a decision changed; `docs/guides/` if a workflow changed
- [ ] The PR is focused on a single, self-contained change
