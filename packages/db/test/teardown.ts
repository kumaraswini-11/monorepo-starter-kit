import { afterAll } from "vitest";

import { pool } from "@workspace/db/client";

/**
 * Close the shared pg pool once per test context, registered as a setup file so every
 * integration file gets it without duplicating the hook — and no file can double-close the
 * globalThis-cached singleton (which throws). Robust under both Vitest isolation modes:
 * `isolate: true` gives each file its own pool + one close; `isolate: false` shares one pool
 * closed once at the end. Ordered AFTER `setup-env` so `DATABASE_URL` is set before the client
 * module loads. (ADR 0029)
 */
afterAll(async () => {
  await pool.end();
});
