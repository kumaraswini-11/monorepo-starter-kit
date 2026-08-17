import "server-only";

import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";

/**
 * Identifier-first account-existence check (ADR 0027 §3) as a Better Auth **plugin
 * endpoint** — so it inherits BA's built-in rate limiting (tuned below) and uses BA's own
 * adapter, instead of a hand-rolled limiter + custom query. Identifier-first inherently
 * reveals existence (the accepted Google/Auth0 trade-off); the rate limit blunts
 * enumeration. Public by design — it runs before the user has a session. Adds no schema.
 */
export const accountExists = () =>
  ({
    id: "account-exists",
    endpoints: {
      accountExists: createAuthEndpoint(
        "/account-exists",
        {
          method: "POST",
          body: z.object({ email: z.string().min(1) }),
        },
        async (ctx) => {
          // BA stores emails normalised; look up the same way.
          const found = await ctx.context.internalAdapter.findUserByEmail(
            ctx.body.email.trim().toLowerCase()
          );
          return ctx.json({ exists: found !== null });
        }
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path) => path === "/account-exists",
        window: 60,
        max: 10,
      },
    ],
  }) satisfies BetterAuthPlugin;
