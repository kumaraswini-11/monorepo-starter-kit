// Build-time guard: this holds the secret + DB adapter, so fail if a client bundle
// ever imports it (ADR 0022). The client entry is the separate `./client` module.
import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { describeDevice, resolveLocation } from "@workspace/auth/device";
import { accountExists } from "@workspace/auth/plugins/account-exists";
import { getUserById, isNewDeviceSignIn } from "@workspace/db";
// Raw Drizzle handle + schema namespace come from the narrow adapter subpath (only the
// auth package needs them); repositories come from the db barrel (ADR 0019).
import { db, schema } from "@workspace/db/client";
import {
  sendNewDeviceEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
} from "@workspace/email";
import { env } from "@workspace/env";
import { firstWord } from "@workspace/utils/string";

/**
 * Framework-neutral Better Auth server instance (ADR 0016). It imports **no**
 * framework code — the app supplies the adapter (`toNextJsHandler` in apps/web; a
 * Node/Express service would use `toNodeHandler` against this same instance).
 *
 * Env comes from the validated `@workspace/env` contract (fail-fast, ADR 0021), not
 * raw `process.env`. `pg` connects lazily and a CI `next build` sets
 * `SKIP_ENV_VALIDATION=1`, so building with no DB/secret stays safe.
 */
/**
 * Google OAuth is enabled only when both credentials are present — a deploy-time choice
 * (ADR 0016), like the SMTP provider. Absent in dev / no-secret CI builds, so no social provider
 * is registered and the app still builds and runs.
 */
const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

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
      try {
        await sendResetPasswordEmail({
          to: user.email,
          firstName: firstWord(user.name),
          email: user.email,
          resetUrl: url,
        });
      } catch (error) {
        // Enumeration-safe + resilient: a mail-transport failure must not become a
        // reset error for existing accounts (non-existent users never reach here).
        console.error("[auth] reset-password email failed to send", error);
      }
    },
    // On a completed reset: sign out the user's other devices (spec §3) and send the
    // confirmation/alert email. Covers the forgot-password flow; the settings
    // "change password" path gets its own hook when that UI lands.
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      try {
        await sendPasswordChangedEmail({
          to: user.email,
          firstName: firstWord(user.name),
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
      try {
        await sendVerifyEmail({
          to: user.email,
          firstName: firstWord(user.name),
          verifyUrl: url,
        });
      } catch (error) {
        // Progressive verification (banner, not a gate): a mail-transport failure must
        // not fail an otherwise-successful sign-up — the user can resend later.
        console.error("[auth] verification email failed to send", error);
      }
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
              firstName: firstWord(signedInUser.name),
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
  // Identifier-first existence check as a BA plugin endpoint — inherits BA's rate limiting
  // (ADR 0027 §3); read-only via the internal adapter, adds no schema.
  plugins: [accountExists()],
  // Social login (ADR 0016). Registered only when credentials are set (see `socialProviders`
  // above); Better Auth serves `/api/auth/callback/<provider>` automatically.
  socialProviders,
  // Account linking (security-critical): link a social sign-in to an existing account only on a
  // VERIFIED email — Better Auth's default. We deliberately do NOT add "email-password" to
  // `trustedProviders`: that would force-link even an *unverified* email/password account to a
  // matching Google sign-in, enabling account takeover (progressive verification means our
  // email/password accounts can be unverified). Google's `email_verified` makes new Google users
  // verified, so a same-email link only happens once the pre-existing account is verified. (ADR 0016)
  account: {
    accountLinking: { enabled: true },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
    freshAge: 60 * 60, // 1h — sensitive flows (change email/password, delete) need a fresh session
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min cookie cache (perf)
  },
  // Behind a proxy/CDN (Vercel/Cloudflare), read the client IP from forwarded headers so
  // rate limiting keys per-IP rather than one shared bucket (security best-practices).
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  telemetry: { enabled: false }, // ADR 0016 — no PII leaves the box
});
