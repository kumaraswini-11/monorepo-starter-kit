import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Apply the committed Drizzle migrations to `connectionString` on a short-lived pool (always
 * closed). Standalone — imports `drizzle`/`pg` directly, NOT `@workspace/db/client`, so it
 * carries no `server-only` guard and runs in any test runner. Shared by the Vitest integration
 * harness and the Playwright e2e global-setup (ADR 0025).
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
 * Defense-in-depth for the destructive helpers below: refuse to run unless the target host is
 * loopback (Testcontainers and the docker-compose e2e DB both are) or the operator has opted in
 * with `ALLOW_DESTRUCTIVE_DB=1`. A prose "never point this at prod" comment is not enough in a
 * compliance-bound repo — a stray `DATABASE_URL` in the shell must not be silently wiped. (ADR 0025)
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", ""]);

export function assertDisposableDatabase(connectionString: string): void {
  if (process.env.ALLOW_DESTRUCTIVE_DB === "1") return;
  let host: string;
  try {
    host = new URL(connectionString).hostname.toLowerCase();
  } catch {
    throw new Error(
      "Refusing a destructive DB reset: DATABASE_URL is missing or unparseable."
    );
  }
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(
      `Refusing a destructive DB reset against non-local host "${host}". Point DATABASE_URL ` +
        "at a disposable/local database, or set ALLOW_DESTRUCTIVE_DB=1 if you are certain. (ADR 0025)"
    );
  }
}

/**
 * Drop and recreate the `public` schema — a clean slate for a **disposable** test/e2e database
 * (deterministic, and it side-steps not-null/backfill migration failures on a DB carrying
 * stale data). Works whether the DB is fresh (CI service) or dirty (a local dev DB). Guarded by
 * `assertDisposableDatabase`; never point it at a database whose data you care about. (ADR 0025)
 */
export async function resetSchema(connectionString: string): Promise<void> {
  assertDisposableDatabase(connectionString);
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
