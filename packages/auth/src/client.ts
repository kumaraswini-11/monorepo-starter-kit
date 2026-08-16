"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client (ADR 0016). Client-only entry — server code uses the `auth`
 * instance from the package root instead. Same-origin by default (the web app serves
 * `/api/auth` itself), so no `baseURL` is needed; a cross-origin consumer would pass
 * one where it re-exports this.
 *
 * `"use client"` marks the client boundary so apps can import it into Server
 * Components without a wrapper (per the Next.js library-author guidance).
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
