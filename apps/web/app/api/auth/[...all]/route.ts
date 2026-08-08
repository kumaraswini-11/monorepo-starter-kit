import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@workspace/auth";

// Mounts the Better Auth API at /api/auth/*. This is the only Next.js-specific
// glue — the auth instance itself is framework-neutral (ADR 0016).
export const { GET, POST } = toNextJsHandler(auth);
