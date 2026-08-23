import { applyMigrations, resetSchema } from "@workspace/db/testing/migrate";

/**
 * Playwright global setup (ADR 0029): give the e2e app a clean, fully-migrated schema before it
 * serves DB-backed routes (the sign-up flow hits `/api/auth/account-exists` and writes
 * user/account/session). Reset-then-migrate is deterministic and works whether `DATABASE_URL`
 * points at a fresh CI Postgres service or a dirty local dev DB. **The e2e database is
 * disposable** — it's wiped each run, so point `DATABASE_URL` at a throwaway DB (the
 * docker-compose `app` DB locally, a service in CI), never one whose data you keep.
 */
export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "e2e requires DATABASE_URL — start the docker-compose Postgres locally " +
        "(`docker compose up -d`) or provide a Postgres service in CI."
    );
  }
  await resetSchema(databaseUrl);
  await applyMigrations(databaseUrl);
}
