import "server-only";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Validated, typed environment — 12-Factor fail-fast (ADR 0013).
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
    // Set by the runtime (Next sets it; a standalone Node backend may not), so it has a default.
    // Behaviour must not fork on it beyond safety guards (e.g. no console email in production).
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Connection string — presence is what matters (pg validates the format on
    // connect); `z.url()` is too strict for the `postgresql://…?sslmode=…` form.
    DATABASE_URL: z.string().min(1),
    // ≥32 chars — Better Auth warns below that (weak-secret guard, ADR 0011).
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    // Email transport (ADR 0014). All optional: with none set, the console stub is used
    // (dev/test only — production refuses it, see packages/email); setting SMTP_HOST switches
    // `packages/email` to the Nodemailer/SMTP sender. Any SMTP provider works (Resend/SES/
    // Postmark/…) — it's a credentials-only choice. EMAIL_TRANSPORT forces one explicitly:
    // "console" is how a production-mode test server (e2e: `next start`) opts into the stub.
    EMAIL_TRANSPORT: z.enum(["smtp", "console"]).optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    // Explicit override; when unset the adapter derives it from the port (465/2465 → true).
    SMTP_SECURE: z.stringbool().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    // Default From (e.g. "efferd <noreply@yourdomain>"); a verified sender at the provider.
    EMAIL_FROM: z.string().min(1).optional(),
    // Google OAuth (ADR 0011). Both optional: set both to enable "Continue with Google";
    // absent → no social provider is registered (dev/CI build stay green). Create a Web OAuth
    // client in Google Cloud Console with redirect URI <BETTER_AUTH_URL>/api/auth/callback/google.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});

/**
 * The app's public origin, safe to read at build time. App code uses this instead of
 * `process.env`. The localhost fallback is reachable ONLY under `SKIP_ENV_VALIDATION` (a
 * validated runtime always has `BETTER_AUTH_URL`), i.e. CI's non-deployable build — a build
 * meant for deployment must set the real origin (robots/sitemap/metadataBase bake it in).
 */
export const appUrl = env.BETTER_AUTH_URL ?? "http://localhost:3000";
