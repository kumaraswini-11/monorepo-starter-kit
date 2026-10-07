import type { PlopTypes } from "@turbo/gen";

/**
 * `pnpm gen package` — the one sanctioned way to add a workspace package (ADR 0036).
 *
 * It scaffolds a package with every repo convention already applied: `@workspace/*` name,
 * `private` + `UNLICENSED`, source-only `exports`, the shared TypeScript / ESLint / Vitest
 * presets, the Boundaries tag, and a README stub. Nothing here is a template of opinions —
 * each file mirrors what the existing packages look like, so "add a package" cannot drift
 * from the conventions. After generating, run `pnpm install` to link it.
 *
 * Non-interactive use (CI / agents): positional answers in prompt order, e.g.
 *   pnpm gen package --args billing node domain "Billing domain logic"
 */
const KINDS = ["node", "react"] as const;
const TAGS = ["domain", "leaf", "ui", "config"] as const;

type Kind = (typeof KINDS)[number];
type Tag = (typeof TAGS)[number];

interface Answers {
  name: string;
  kind: Kind;
  tag: Tag;
  description: string;
}

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description:
      "Scaffold a new @workspace/* package with the repo conventions",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Package name (without the @workspace/ scope, kebab-case):",
        validate: (value: string) =>
          NAME_PATTERN.test(value) ||
          "Use kebab-case: lowercase letters, digits and dashes, starting with a letter.",
      },
      {
        type: "list",
        name: "kind",
        message: "Kind:",
        choices: [
          {
            name: "node   — server / isomorphic TypeScript (base preset)",
            value: "node",
          },
          {
            name: "react  — React components (react-library preset, jsdom tests)",
            value: "react",
          },
        ],
      },
      {
        type: "list",
        name: "tag",
        message:
          "Boundaries tag (dependency direction: leaf → domain → ui → apps):",
        choices: [
          {
            name: "domain — server-side capability (may use leaf + other domain packages)",
            value: "domain",
          },
          { name: "leaf   — pure, dependency-free helpers", value: "leaf" },
          {
            name: "ui     — design-system code (may use leaf only)",
            value: "ui",
          },
          { name: "config — shared tooling configuration", value: "config" },
        ],
      },
      {
        type: "input",
        name: "description",
        message: "One-line description (README + package.json):",
        validate: (value: string) => value.trim().length > 0 || "Required.",
      },
    ],
    actions: (data) => {
      const answers = data as Answers;
      const base = "packages/{{ name }}";
      const files = [
        "package.json",
        "tsconfig.json",
        "eslint.config.js",
        "vitest.config.ts",
        "turbo.json",
        "README.md",
        "src/index.ts",
        "src/index.test.ts",
      ];
      const actions: PlopTypes.ActionType[] = files.map((file) => ({
        type: "add",
        path: `${base}/${file}`,
        templateFile: `templates/package/${file}.hbs`,
        data: { isReact: answers.kind === "react" },
      }));
      actions.push(
        `Package scaffolded at packages/${answers.name}. Next: pnpm install, then add it to the ` +
          `consumer's package.json as "@workspace/${answers.name}": "workspace:*".`
      );
      return actions;
    },
  });
}
