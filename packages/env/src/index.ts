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
    // ≥32 chars — Better Auth warns below that (weak-secret guard, ADR 0016).
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_TELEMETRY: z.string().optional(),
    // Email transport (ADR 0020). All optional: with none set, the console stub is used
    // (dev/test); setting SMTP_HOST switches `packages/email` to the Nodemailer/SMTP sender.
    // Any SMTP provider works (Resend/SES/Postmark/…) — it's a credentials-only choice.
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    // Explicit override; when unset the adapter derives it from the port (465/2465 → true).
    SMTP_SECURE: z.stringbool().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    // Default From (e.g. "efferd <noreply@yourdomain>"); a verified sender at the provider.
    EMAIL_FROM: z.string().min(1).optional(),
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
