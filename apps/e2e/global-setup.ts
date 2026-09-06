import { applyMigrations, resetSchema } from "@workspace/db/testing/migrate";

import { DEFAULT_DATABASE_URL } from "./support/db.js";

/**
 * Playwright global setup (ADR 0025): give the e2e app a clean, fully-migrated schema before it
 * serves DB-backed routes (the auth flows write user/account/session). Reset-then-migrate is
 * deterministic and works whether `DATABASE_URL` points at a fresh CI Postgres service or a
 * dirty local dev DB. Resolves the SAME default as the `webServer` (support/db.ts), so the two
 * can't disagree. `resetSchema` refuses a non-loopback host unless `ALLOW_DESTRUCTIVE_DB=1`, so
 * a stray `DATABASE_URL` can't be wiped — **the e2e database is disposable** and gets reset
 * every run.
 */
export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  await resetSchema(databaseUrl);
  await applyMigrations(databaseUrl);
}
