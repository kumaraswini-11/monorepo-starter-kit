import { inject } from "vitest";

/**
 * Runs in each worker before the test modules import anything. Point the lazily-connecting
 * `@workspace/db` client (and, in auth tests, the Better Auth instance) at the ephemeral
 * container BEFORE `@workspace/env` is first evaluated, and satisfy env's other required
 * vars with throwaway test values. (ADR 0025 §11)
 */
process.env.DATABASE_URL = inject("DATABASE_URL");
process.env.BETTER_AUTH_SECRET ??=
  "test-secret-at-least-32-characters-long-000";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
