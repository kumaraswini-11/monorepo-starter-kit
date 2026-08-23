import { nextJsConfig } from "@workspace/eslint-config/next-js";

/**
 * Seam boundary (ADR 0027 §1): the Better Auth transport must stay behind the seam so the
 * app-side enumeration-safe error mapping can never be bypassed and the backend split stays a
 * one-file change. Only `lib/auth-client.ts` may import the shared client, and only the seam
 * (`lib/auth/**`) may import that app-local re-export.
 *
 * Because ESLint flat config *replaces* (not merges) a rule's options, the app-wide entry below
 * re-declares the shared deep-import guard (ADR 0022) alongside the seam patterns, and the two
 * exemptions keep it — dropping only the pattern each exempt location legitimately needs.
 */
const noDeepImports = {
  group: ["@workspace/*/src/*", "@workspace/*/src/**"],
  message:
    "Deep import bypasses the package's exports map — import from its public entry, not `src/` (ADR 0022).",
};
const noRawAuthClient = {
  group: ["@workspace/auth/client"],
  message:
    "Import the auth client only in lib/auth-client.ts; the rest of the app goes through the seam at lib/auth/actions.ts (ADR 0027 §1).",
};
const noSeamBypass = {
  group: ["@/lib/auth-client"],
  message:
    "Use the seam wrappers in lib/auth/actions.ts (enumeration-safe error mapping), not the raw auth client (ADR 0027 §1).",
};

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noDeepImports, noRawAuthClient, noSeamBypass] },
      ],
    },
  },
  {
    // The single app-local binding point may import the shared client (nothing else needs it).
    files: ["lib/auth-client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noDeepImports, noSeamBypass] },
      ],
    },
  },
  {
    // The seam owns the transport — it imports the app-local client, never the package directly.
    files: ["lib/auth/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noDeepImports, noRawAuthClient] },
      ],
    },
  },
];
