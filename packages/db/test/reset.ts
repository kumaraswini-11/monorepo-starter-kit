import { sql } from "drizzle-orm";

import { db } from "@workspace/db/client";
import { assertDisposableDatabase } from "@workspace/db/testing/migrate";

/**
 * Truncate every table for integration-test isolation (fast; `beforeEach`). Shared across every
 * package's integration tests via `@workspace/db/testing/reset` (ADR 0029 §11).
 *
 * The table list is derived from `pg_tables` at runtime rather than hard-coded, so isolation
 * stays correct as the schema grows (downstream domain tables, new Better Auth plugin tables)
 * with zero maintenance — a forgotten table would otherwise leak rows across tests and read as
 * flakiness. Guarded so it can only run against a disposable/local database.
 */
export async function resetDb(): Promise<void> {
  assertDisposableDatabase(process.env.DATABASE_URL ?? "");

  const result = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'`
  );
  const tables = result.rows.map((row) => `"${row.tablename}"`);
  if (tables.length === 0) return;

  // Identifiers come from the catalog (not user input); one statement so CASCADE resolves FKs.
  await db.execute(
    sql.raw(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`)
  );
}
