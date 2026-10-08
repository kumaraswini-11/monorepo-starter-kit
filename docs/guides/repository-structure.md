# Repository structure

```text
.
├── apps/                      DEPLOYABLES only
│   ├── web/                   Next.js 16 app (feature-first, ADR 0028); Boundaries tag `app`
│   └── storybook/             design-system site + browser-mode story tests (ADR 0024); `app`
├── packages/                  libraries and tooling, all `@workspace/*`, all source-only (ADR 0016)
│   ├── utils/                 pure, isomorphic helpers — the only `leaf`
│   ├── env/  db/  email/  auth/   server-side capabilities — `domain`
│   ├── ui/                    the single design system (shadcn on Base UI) — `ui`
│   ├── e2e/                   Playwright harness; nothing depends on it — `test`
│   └── eslint-config/  typescript-config/  vitest-config/   shared presets — `config`
├── turbo/generators/          `pnpm gen package` scaffold (ADR 0036)
├── scripts/                   repo-management scripts only (licence policy check); linted, typed JS
├── docs/
│   ├── decisions/             ADRs — the why
│   ├── guides/                these files — the how
│   ├── audits/                periodic foundation re-evaluations
│   └── specs/ · future-improvements.md · references.md · bookmarks.md
├── .github/                   CI workflows, composite setup action, Dependabot, CODEOWNERS,
│                              issue/PR templates, importable ruleset
├── .husky/                    git hooks (ADR 0037)
├── .agents/skills/ · skills-lock.json    vendored agent skills (ADR 0010)
├── AGENTS.md · CLAUDE.md      single source of agent instructions (ADR 0008)
├── package.json               root: repo-management tools only (turbo, prettier, knip, hooks, taze)
├── pnpm-workspace.yaml        workspaces · the dependency catalog (ADR 0034) · pnpm settings
├── turbo.json                 task graph + Boundaries tags (ADR 0035, 0036)
├── tsconfig.json              root tooling files only (generator, knip.ts)
└── eslint.config.js (root tooling) · knip.ts · commitlint.config.js · taze.config.mjs · .prettierrc · .editorconfig · .gitattributes
```

## Rules of placement

- **`apps/` means it deploys.** Anything else — libraries, harnesses, presets — is a package.
  There are no `tooling/`, `configs/` or `infra/` directories: they would be empty or duplicate
  `packages/`. `scripts/` holds repo-management scripts only (never app code).
- **A package has one purpose and one public surface** (its `exports` map). Consumers never
  import from `src/`; packages never alias each other with `paths` (ADR 0036).
- **Dependency direction** is `utils` → domain packages → `ui` → apps, enforced by ESLint rules
  and Turborepo Boundaries tags (ADR 0016, 0036). `config` packages are devDependencies of
  everyone and depend on nothing internal.
- **Feature code lives in the app** (`apps/web/features/<name>/`, imported only through its
  barrel — ADR 0028). Proven-generic UI goes to `@workspace/ui`; uncertain UI waits for a second
  consumer (ADR 0026).
- **Editor-agnostic by design**: tool-native configs (ESLint, Prettier, TypeScript) plus
  `.editorconfig`; no editor-specific directory is committed.

## Managed blocks you will see

`AGENTS.md` contains two managed blocks (`nextjs-agent-rules`, `turborepo-agent-rules`) that
`next dev` and `turbo` write themselves; keep them committed (ADR 0008). Everything else in the
file is ours.
