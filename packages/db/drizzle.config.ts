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
});

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
