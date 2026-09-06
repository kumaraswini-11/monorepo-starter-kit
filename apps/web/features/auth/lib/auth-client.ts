"use client";

/**
 * App-local re-export of the shared browser auth client (`@workspace/auth/client`) — the single
 * place app-specific config (baseURL, plugins) is added when the backend splits out (ADR 0017),
 * without touching call sites. This is the ONLY module allowed to import the shared client, and
 * only the seam (`lib/auth/actions.ts`) may import THIS — both enforced by a `no-restricted-imports`
 * rule in eslint.config.js, so the enumeration-safe error mapping in the seam can never be bypassed.
 */
export { authClient } from "@workspace/auth/client";
