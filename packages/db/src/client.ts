// Build-time guard: fail if the DB layer is ever imported into a client bundle
// (ADR 0016 — server-only data access).
import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@workspace/db/schema";
import { env } from "@workspace/env";

/**
 * Pooled Postgres connection. `DATABASE_URL` is validated by `@workspace/env`
 * (fail-fast — ADR 0013); `pg` still connects lazily (on first query), so a CI
 * `next build` with `SKIP_ENV_VALIDATION=1` stays safe. (ADR 0012.)
 *
 * Cached on `globalThis` so Turbopack HMR doesn't leak a new pool on every edit
 * ("too many clients" in dev); prod evaluates this module once, so the cache is a
 * harmless no-op there. (Unconditional — reading `process.env.NODE_ENV` here would trip
 * the repo's `no-restricted-syntax` env choke-point rule.)
 */
const globalForDb = globalThis as unknown as { __workspaceDbPool?: Pool };
const pool = (globalForDb.__workspaceDbPool ??= createPool());

function createPool(): Pool {
  const created = new Pool({
    connectionString: env.DATABASE_URL,
    // Deliberate sizing (ADR 0012): one Next.js instance keeps at most 10 connections; scale
    // horizontally through PgBouncer rather than by raising this. A connect attempt that hangs
    // (DNS/firewall/overloaded server) fails after 5s instead of waiting forever (pg-pool default).
    max: 10,
    connectionTimeoutMillis: 5_000,
  });
  // pg-pool emits `error` for an IDLE client that fails (server restart, failover, network
  // partition). Pool is an EventEmitter: with no listener that event is thrown and kills the
  // process. Log it; the next query gets a fresh client (pg-pool README, "error" event).
  created.on("error", (error) => {
    console.error("[db] idle client error", error);
  });
  return created;
}

export const db = drizzle(pool, { schema });
export { pool, schema };
export type Database = typeof db;
