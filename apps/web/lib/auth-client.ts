"use client";

/**
 * App-local re-export of the shared browser auth client (`@workspace/auth/client`).
 * Components import from here so app-specific config (baseURL, plugins) can be added
 * in one place later without touching call sites.
 */
export {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
} from "@workspace/auth/client";
