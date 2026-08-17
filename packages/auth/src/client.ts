"use client";

import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthClient } from "better-auth/react";

import type { accountExists } from "@workspace/auth/plugins/account-exists";

/**
 * Client half of the account-exists plugin — makes the server endpoint available as
 * `authClient.accountExists({ email })` for identifier-first routing (ADR 0027 §3). The
 * server plugin is imported type-only, so no server code reaches the client bundle.
 */
const accountExistsClient = () =>
  ({
    id: "account-exists",
    $InferServerPlugin: {} as ReturnType<typeof accountExists>,
  }) satisfies BetterAuthClientPlugin;

/**
 * Browser auth client (ADR 0016). Client-only entry — server code uses the `auth`
 * instance from the package root instead. Same-origin by default (the web app serves
 * `/api/auth` itself), so no `baseURL` is needed; a cross-origin consumer would pass
 * one where it re-exports this.
 *
 * `"use client"` marks the client boundary so apps can import it into Server
 * Components without a wrapper (per the Next.js library-author guidance).
 */
export const authClient = createAuthClient({
  plugins: [accountExistsClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
