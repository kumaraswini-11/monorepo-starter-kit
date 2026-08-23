import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Apply the committed Drizzle migrations to `connectionString` on a short-lived pool (always
 * closed). Standalone — imports `drizzle`/`pg` directly, NOT `@workspace/db/client`, so it
 * carries no `server-only` guard and runs in any test runner. Shared by the Vitest integration
 * harness and the Playwright e2e global-setup (ADR 0029).
 */
export async function applyMigrations(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: fileURLToPath(
        new URL("../migrations", import.meta.url)
      ),
    });
  } finally {
    await pool.end();
  }
}

/**
 * Drop and recreate the `public` schema — a clean slate for a **disposable** test/e2e database
 * (deterministic, and it side-steps not-null/backfill migration failures on a DB carrying
 * stale data). Works whether the DB is fresh (CI service) or dirty (a local dev DB). Never
 * point this at a database whose data you care about. (ADR 0029)
 */
export async function resetSchema(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    // Drop `public` (the tables) AND `drizzle` (the migration-history table) so migrations
    // re-apply from 0000 — dropping only `public` would leave a stale history that skips the
    // initial migration.
    await pool.query(
      "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;"
    );
  } finally {
    await pool.end();
  }
}
