# Contributing to monorepo-starter-kit

First off, thank you for taking the time to contribute! 🎉

This guide explains how to contribute to **monorepo-starter-kit**. Following it
keeps the project consistent, makes reviews faster, and respects everyone's time.

We welcome several kinds of contributions:

- 🐛 Bug reports and fixes
- ✨ Features and enhancements
- 📝 Documentation improvements
- 🧪 Tests
- 💡 Ideas and feedback

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold it. Please report unacceptable behavior as described there.

## Ground Rules

- Be respectful and constructive.
- Open an issue to discuss significant changes **before** starting work, so no
  effort is wasted.
- Keep pull requests focused — one logical change per PR.
- Make sure the full check suite passes before requesting review (see below).
- Add or update tests and documentation when your change warrants it.

## Your First Contribution

Not sure where to start? Look for issues labeled `good first issue` or
`help wanted` — they're scoped to be approachable.

New to open source? These resources help:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Making a Pull Request](https://makeapullrequest.com/)

## Getting Started

### Prerequisites

- **Node.js** 20 or newer (latest LTS recommended)
- **pnpm** via [Corepack](https://nodejs.org/api/corepack.html): `corepack enable`

### Set up the project

```bash
# Fork and clone the repo, then:
pnpm install
pnpm dev        # starts the app at http://localhost:3000
```

### Project layout

| Path                         | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `apps/web`                   | Next.js 16 application                         |
| `apps/docs`                  | Documentation site (placeholder)               |
| `packages/ui`                | Shared component library (shadcn/ui + Base UI) |
| `packages/eslint-config`     | Shared ESLint flat configs                     |
| `packages/typescript-config` | Shared `tsconfig` presets                      |

### Make your change

1. Create a branch: `git checkout -b feat/short-description`
2. Make your change (add a UI component with
   `pnpm dlx shadcn@latest add <name> -c apps/web`).
3. Run the full check suite and make sure it passes:

   ```bash
   pnpm format      # auto-format with Prettier
   pnpm lint        # ESLint (must pass with zero warnings)
   pnpm typecheck   # TypeScript
   pnpm build       # production build
   ```

4. Commit using [Conventional Commits](#commit-code--branch-conventions).
5. Push your branch and open a pull request against `main`, describing **what**
   changed and **why**.

### Small or obvious fixes

Typo fixes, comment tweaks, and other trivial changes can go straight to a pull
request without opening an issue first.

## How to Report a Bug

### Security issues come first

**If you find a security vulnerability, do _not_ open a public issue.** Follow
the private disclosure process in [SECURITY.md](SECURITY.md) instead.

### Filing a (non-security) bug

Open an issue and include:

- What you expected to happen, and what actually happened
- Clear steps to reproduce (a minimal reproduction is ideal)
- Your environment: OS, Node version, pnpm version, and browser (if relevant)
- Relevant logs, screenshots, or error output

## How to Suggest a Feature or Enhancement

Open an issue that describes:

- The problem you're trying to solve (the "why")
- Your proposed solution, and any alternatives you considered
- Rough scope or size, if you have a sense of it

Let's align on the approach in the issue before significant implementation work
begins.

## Code Review Process

- A maintainer will review your pull request and may request changes.
- Keep discussion in the PR thread and push follow-up commits as needed.
- Once it's approved and all checks pass, a maintainer will merge it.
- We aim to give initial feedback within a few days — feel free to ping the PR
  if it goes quiet.

## Community

Questions and discussion happen in GitHub Issues (and Discussions, if enabled).
Provide context so others can help you effectively.

## Commit, Code & Branch Conventions

### Commit messages — Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):
`<type>: <description>` — for example, `feat: add user settings page` or
`fix: correct button focus ring`. Common types: `feat`, `fix`, `docs`, `style`,
`refactor`, `test`, `chore`.

### Code style

Formatting and linting are enforced by Prettier and ESLint — run `pnpm format`
and `pnpm lint` before pushing. Keep shared, reusable UI in `packages/ui`, and
keep app-specific code in `apps/*`.

### Branch naming

`type/short-description` — for example, `feat/user-settings` or
`fix/button-focus`.

---

Thank you again for contributing! 🙌
