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
// Single source of truth for the two choice prompts: the key is the answer value, the text is
// the prompt label. Types derive from here so a new kind/tag cannot drift from its prompt.
const KINDS = {
  node: "node   — server / isomorphic TypeScript (base preset)",
  react: "react  — React components (react-library preset, jsdom tests)",
} as const;
const TAGS = {
  domain:
    "domain — server-side capability (may use leaf + other domain packages)",
  leaf: "leaf   — pure, dependency-free helpers",
  ui: "ui     — design-system code (may use leaf only)",
  config: "config — shared tooling configuration",
} as const;

type Kind = keyof typeof KINDS;
type Tag = keyof typeof TAGS;

const choices = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, name]) => ({ name, value }));

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
        choices: choices(KINDS),
      },
      {
        type: "list",
        name: "tag",
        message:
          "Boundaries tag (dependency direction: leaf → domain → ui → apps):",
        choices: choices(TAGS),
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
        ...(answers.kind === "react" ? ["vitest.d.ts"] : []),
      ];
      const actions: PlopTypes.ActionType[] = files.map((file) => ({
        type: "add",
        path: `${base}/${file}`,
        templateFile: `templates/package/${file}.hbs`,
        data: {
          isReact: answers.kind === "react",
          isLeaf: answers.tag === "leaf",
        },
      }));
      actions.push(
        `Package scaffolded at packages/${answers.name}. Next: pnpm install, then add it to the ` +
          `consumer's package.json as "@workspace/${answers.name}": "workspace:*".`
      );
      return actions;
    },
  });
}
