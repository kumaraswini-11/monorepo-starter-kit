import "server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Validated, typed environment — 12-Factor fail-fast (ADR 0021).
 *
 * **Framework-agnostic on purpose:** built on `@t3-oss/env-core` (NOT `env-nextjs`)
 * + `process.env`, so it runs unchanged in Next (fullstack) or a standalone Node
 * backend — no lock-in. Consumers import `env` instead of reading `process.env`, so a
 * missing/malformed required var throws **at startup**, not silently (this replaces
 * the old `process.env.X ?? "…"` fallbacks that masked bad config).
 *
 * `skipValidation` keeps `next build` green when secrets are absent (CI) — set
 * `SKIP_ENV_VALIDATION=1` there; real runtimes (and local `.env.local`) validate.
 * All vars are server-side today, hence the `server-only` guard; add a client block
 * (with `clientPrefix`) if a browser var ever appears.
 */
export const env = createEnv({
  server: {
    // Connection string — presence is what matters (pg validates the format on
    // connect); `z.url()` is too strict for the `postgresql://…?sslmode=…` form.
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_TELEMETRY: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});

/**
 * The app's public origin, safe to read at build time (falls back to localhost when
 * validation is skipped in CI). App code uses this instead of `process.env`.
 */
export const appUrl = env.BETTER_AUTH_URL ?? "http://localhost:3000";
