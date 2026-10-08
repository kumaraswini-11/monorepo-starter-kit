# CI/CD & repository governance

Governing decisions: [0007](../decisions/0007-github-automation-governance-and-branch-protection.md),
[0035](../decisions/0035-task-graph-correctness-and-affected-ci.md),
[0037](../decisions/0037-git-hooks-commit-governance-and-pr-gates.md),
[0033](../decisions/0033-toolchain-version-policy-and-2026-10-modernization.md).

## Workflows

| Workflow                | Trigger                                             | Jobs / purpose                                                                                                                               |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                | push to `main`, PRs, merge queue                    | `check` (format, dedupe, lint + typecheck + build, knip, Boundaries advisory, blocking audit) · `test` · `integration` · `e2e` · `storybook` |
| `codeql.yml`            | push/PR to `main`, weekly                           | static security + quality analysis                                                                                                           |
| `dependency-review.yml` | PRs                                                 | new vulnerable deps / copyleft licences block the PR                                                                                         |
| `pr-title.yml`          | PRs (`pull_request_target`, read-only, no checkout) | Conventional Commit title (becomes the squash commit)                                                                                        |

Every job starts with `./.github/actions/setup` (pnpm from `packageManager`, Node from
`devEngines.runtime`, store cache, frozen install). On pull requests Turborepo runs only
**affected** packages; `main` and merge-queue runs are full.

## Local equivalent of the gate

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm knip
pnpm exec turbo boundaries
```

Git hooks run lint-staged (format + lint on staged files) and commitlint; CI remains the gate.

## Conventions the pipeline relies on

- Actions are pinned to a full commit SHA with the version in a trailing comment; Dependabot
  (weekly, once the template switch in AGENTS.md is on) keeps them current — until then, bump
  the SHAs by hand on the monthly routine. Enable the repository policy "require actions to be pinned to a
  full-length commit SHA".
- `permissions` are the minimum per job; `persist-credentials: false` on every checkout.
- `SKIP_ENV_VALIDATION=1` and `HUSKY=0` at workflow level.
- Job **names** are the required status checks in `.github/rulesets/main.json` — rename a job
  and the ruleset must follow.

## Repository settings (owner, once)

1. Import `.github/rulesets/main.json` (Settings → Rules → Rulesets → Import).
2. Enable Dependabot alerts + security updates and the dependency graph.
3. Default merge method **squash**, delete branch on merge.
4. Actions: workflow permissions read-only; require SHA pinning.
5. Raise required approvals to 1+ and enable Code-Owner review as the team forms.
6. Before enabling a **merge queue**: every required check must also run on `merge_group`
   (`ci.yml` and `codeql.yml` do). `Dependency review` and `PR title` are PR-time gates
   with no merge-group equivalent — remove them from the ruleset's required checks first, or
   queued PRs stall waiting for a check that never reports.

## Plan-dependent features

CodeQL, dependency review and (if ever used) Scorecard / artifact attestations are free on
public repositories and require **GitHub Code Security** (Team/Enterprise) on private ones. A
derived private repository either licenses them or deletes those workflows — never carries a
permanently red check.

## Remote cache (opt-in)

Turborepo Remote Cache shares the task cache across CI runs and machines. Documented path:
`vercel/setup-turborepo-remote-cache-action` with OIDC (`id-token: write`, `TURBO_TEAM`), or a
self-hosted server implementing the open API. When enabled, set `remoteCache.signature: true`
and a ≥ 32-byte `TURBO_REMOTE_CACHE_SIGNATURE_KEY`. Not enabled today (compliance decision
pending).

## Deployment

No deployment target is chosen yet (ADR 0013/0017). The documented monorepo path for
containers is `output: 'standalone'` + `outputFileTracingRoot` in Next and `turbo prune --docker`
to produce a minimal build context; add a Dockerfile only together with a CI job that builds it.
