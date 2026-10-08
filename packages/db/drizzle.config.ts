import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit is a separate dev-tooling process, so it doesn't inherit the app's
 * runtime env. Load the app's local env file (ADR 0013 keeps env in apps/web, not
 * the repo root). This is the ONLY app coupling in packages/db and it's dev-only —
 * the package's runtime client reads `process.env` with zero app knowledge.
 */
config({
  path: fileURLToPath(new URL("../../apps/web/.env.local", import.meta.url)),
  // dotenv 17 logs an "injected env" tip on every run; the file may also be absent (CI, prod
  // migrate), where the variable comes from the environment itself.
  quiet: true,
});

// Fail fast with a clear message (ADR 0013) instead of drizzle-kit's opaque connection error —
// but only when drizzle-kit itself runs a DB-touching command. `generate` works from the
// snapshots alone, and other tools load this file too (knip's drizzle plugin, in CI without a
// database), so the module must stay importable without a URL.
const url = process.env.DATABASE_URL;
const invokedByDrizzleKit = process.argv.some((arg) =>
  arg.includes("drizzle-kit")
);
const needsDb = invokedByDrizzleKit && !process.argv.includes("generate");
if (needsDb && !url) {
  throw new Error(
    "DATABASE_URL is not set — export it or put it in apps/web/.env.local (ADR 0013)."
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "" },
});
