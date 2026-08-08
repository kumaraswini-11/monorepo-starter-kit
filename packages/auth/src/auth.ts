import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db, schema } from "@workspace/db";
import { sendResetPasswordEmail, sendVerifyEmail } from "@workspace/email";

/**
 * Framework-neutral Better Auth server instance (ADR 0016). It imports **no**
 * framework code — the app supplies the adapter (`toNextJsHandler` in apps/web; a
 * Node/Express service would use `toNodeHandler` against this same instance).
 *
 * Env is read from `process.env` for now; it moves behind the validated
 * `@workspace/env` contract later (ADR 0021). `pg` connects lazily and Better Auth
 * tolerates a missing secret at build, so `next build` with no DB/secret stays safe.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Progressive verification (auth UI/UX spec): a banner, not a hard gate.
    requireEmailVerification: false,
    minPasswordLength: 10,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        firstName: user.name.split(" ")[0],
        email: user.email,
        resetUrl: url,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerifyEmail({
        to: user.email,
        firstName: user.name.split(" ")[0],
        verifyUrl: url,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min cookie cache (perf)
  },
  telemetry: { enabled: false }, // ADR 0016 — no PII leaves the box
});
