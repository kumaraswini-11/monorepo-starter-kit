// Build-time guard: this holds the secret + DB adapter, so fail if a client bundle
// ever imports it (ADR 0022). The client entry is the separate `./client` module.
import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { describeDevice, resolveLocation } from "@workspace/auth/device";
import { db, getUserById, isNewDeviceSignIn, schema } from "@workspace/db";
import {
  sendNewDeviceEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
} from "@workspace/email";
import { env } from "@workspace/env";

/**
 * Framework-neutral Better Auth server instance (ADR 0016). It imports **no**
 * framework code — the app supplies the adapter (`toNextJsHandler` in apps/web; a
 * Node/Express service would use `toNodeHandler` against this same instance).
 *
 * Env comes from the validated `@workspace/env` contract (fail-fast, ADR 0021), not
 * raw `process.env`. `pg` connects lazily and a CI `next build` sets
 * `SKIP_ENV_VALIDATION=1`, so building with no DB/secret stays safe.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
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
    // On a completed reset: sign out the user's other devices (spec §3) and send the
    // confirmation/alert email. Covers the forgot-password flow; the settings
    // "change password" path gets its own hook when that UI lands.
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      try {
        await sendPasswordChangedEmail({
          to: user.email,
          firstName: user.name.split(" ")[0],
          email: user.email,
        });
      } catch (error) {
        // A failed notification must not break the already-completed reset.
        console.error("[auth] password-changed email failed to send", error);
      }
    },
  },
  emailVerification: {
    // Progressive verification (auth UI/UX spec): email on sign-up + show a banner,
    // but don't block access (requireEmailVerification stays false above).
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerifyEmail({
        to: user.email,
        firstName: user.name.split(" ")[0],
        verifyUrl: url,
      });
    },
  },
  // Security notification (spec §4): email the user when a session is created from a
  // device we haven't seen for them before. Runs on every sign-in; the check + user
  // lookup stay behind packages/db (ADR 0019). Never throws into the auth flow.
  databaseHooks: {
    session: {
      create: {
        after: async (session, context) => {
          try {
            const newDevice = await isNewDeviceSignIn({
              userId: session.userId,
              currentSessionId: session.id,
              userAgent: session.userAgent,
            });
            if (!newDevice) return;

            const signedInUser = await getUserById(session.userId);
            if (!signedInUser) return;

            await sendNewDeviceEmail({
              to: signedInUser.email,
              firstName: signedInUser.name.split(" ")[0],
              device: describeDevice(session.userAgent),
              location: resolveLocation(context?.headers, session.ipAddress),
              timestamp: new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              }).format(new Date(session.createdAt)),
            });
          } catch (error) {
            console.error("[auth] new-device email failed to send", error);
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min cookie cache (perf)
  },
  telemetry: { enabled: false }, // ADR 0016 — no PII leaves the box
});
