import { nextJsConfig } from "@workspace/eslint-config/next-js";

/**
 * App-local import governance, layered on the shared config. Two boundaries:
 *
 * 1. **Feature boundary (ADR 0028):** a feature is imported only through its public API
 *    (`@/features/<name>`), never its internals (`@/features/<name>/...`). Inside a feature, use
 *    relative imports. Keeps features self-contained/liftable and their public surface a single,
 *    reviewable file. Composition roots (routes, the app shell) compose features via their barrels.
 * 2. **Seam boundary (ADR 0017 §1):** the Better Auth transport stays behind the seam so the
 *    app-side enumeration-safe error mapping can't be bypassed and the backend split stays a
 *    one-file change. Only `features/auth/lib/auth-client.ts` may import the shared client, and only
 *    the seam (`features/auth/actions.ts`) may reference that app-local re-export.
 *
 * Because ESLint flat config *replaces* (not merges) a rule's options, every `no-restricted-imports`
 * entry below re-declares the shared deep-import guard (ADR 0016) + the feature boundary alongside
 * the seam patterns; the two seam exemptions drop only the one pattern each exempt file needs.
 */
const noDeepImports = {
  group: ["@workspace/*/src/*", "@workspace/*/src/**"],
  message:
    "Deep import bypasses the package's exports map — import from its public entry, not `src/` (ADR 0016).",
};
const noRawAuthClient = {
  group: ["@workspace/auth/client"],
  message:
    "Import the auth client only in features/auth/lib/auth-client.ts; the rest of the app goes through the seam at features/auth/actions.ts (ADR 0017 §1).",
};
const noSeamBypass = {
  group: ["@/features/auth/lib/auth-client"],
  message:
    "Use the seam wrappers in features/auth/actions.ts (enumeration-safe error mapping), not the raw auth client (ADR 0017 §1).",
};
const noCrossFeatureInternals = {
  group: ["@/features/*/**"],
  message:
    "Import a feature through its public API (@/features/<name>), not its internals (ADR 0028). Inside a feature, use relative imports.",
};

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noDeepImports,
            noRawAuthClient,
            noSeamBypass,
            noCrossFeatureInternals,
          ],
        },
      ],
    },
  },
  {
    // The single app-local binding point may import the shared client (nothing else needs it).
    files: ["features/auth/lib/auth-client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noDeepImports, noSeamBypass, noCrossFeatureInternals] },
      ],
    },
  },
  {
    // The seam owns the transport — it imports the app-local client, never the package directly.
    files: ["features/auth/actions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noDeepImports, noRawAuthClient, noCrossFeatureInternals] },
      ],
    },
  },
];
