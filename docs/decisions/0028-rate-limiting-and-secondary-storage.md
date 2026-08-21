# 0028. Rate limiting & secondary storage — Redis for production, wired at deploy

- **Status:** Accepted
- **Date:** 2026-08-17

## Context

Better Auth ships a **built-in rate limiter, enabled by default in production** (disabled in
dev), covering all `/api/auth/*` routes — including our `account-exists` plugin endpoint (ADR
0027 §3). Defaults: **100 req / 60s** globally, with **sensitive paths stricter (3 / 10s)** —
`/sign-in/email`, `/two-factor/verify`, … — and it applies to **client-initiated requests
only** (server `auth.api` calls are exempt). Tune with `rateLimit.customRules` (wildcards).

So rate limiting itself is **not** something we add — BA does it. The only open question is
its **storage**, which **defaults to in-memory**: per-instance and reset on cold start, so on
serverless / multi-instance (e.g. Vercel) the limits are largely ineffective in production
(god-mode audit, Med). The same applies to sessions + any future caching at >1 instance.

Better Auth storage options: **memory** (dev only), **database** (persistent, no extra
infra), and **secondary-storage** (Redis/KV — BA's default when available).

## Decision

Adopt **Redis (`secondary-storage`) as the production store** for rate limiting (and, when it
lands, sessions + caching) — but **wire it at the deploy/scale trigger, not now**. The
undeployed, single-instance template stays on the default (rate limiting is off in dev
anyway). This ADR records the decision + the turnkey wiring so adoption is a lookup, not a
re-investigation — the same "decide now, adopt at the trigger" pattern as
[0004](0004-defer-typescript-7.md) (tooling majors) and
[0022](0022-shared-code-and-utilities-organization.md) (`@workspace/utils`).

### Why Redis, not the database

- **Ephemeral, high-frequency, shared:** rate-limit counters are per-request writes with a
  TTL, shared across all instances — the canonical Redis workload (atomic `INCR`/`EXPIRE`,
  sub-millisecond, in-memory). Sessions + caching are the same shape.
- **Keep churn off the primary DB:** Postgres is the durable, transactional source of truth
  ([0019](0019-data-layer-postgres-drizzle.md)); routing a write-per-request onto it adds load
  and contention. Redis absorbs it.
- **Horizontal scale:** one shared Redis enforces limits globally across N instances; memory
  cannot, and the DB pays the cost above.
- **Database storage** remains the documented **no-infra fallback** for small / single-DB
  deployments; **memory** is dev-only.

### Why not now (YAGNI)

Wiring Redis is real infrastructure — a Redis instance (docker for dev + managed for prod), a
client + `REDIS_URL`, the `secondaryStorage` adapter — and defining `secondaryStorage` in
Better Auth also **relocates sessions to Redis by default**. Adding all that to an undeployed,
single-instance template (dev rate-limiting off) is premature infra.

## Turnkey wiring (do this at the deploy/scale trigger)

1. **Client + env:** add a Redis client — `ioredis` / `redis` for a self-hosted or managed
   Redis, or `@upstash/redis` (HTTP) for serverless/edge. Add `REDIS_URL` (or Upstash REST
   creds) to `@workspace/env`, `.env.example`, and `turbo.json` passthrough; a `redis` service
   in `docker-compose.yml` for local dev.
2. **`packages/auth` config:**
   ```ts
   // Prefer a BA `redisStorage()` helper if one ships (it implements the full interface).
   // Manually — secondary-storage RATE LIMITING requires an atomic `increment`; BA throws
   // "SecondaryStorage.increment is required" without it:
   secondaryStorage: {
     get: (key) => redis.get(key),
     set: (key, value, ttl) =>
       ttl ? redis.set(key, value, "EX", ttl) : redis.set(key, value),
     delete: (key) => redis.del(key),
     increment: async (key, ttl) => {
       const count = await redis.incr(key); // atomic counter
       if (count === 1 && ttl) await redis.expire(key, ttl);
       return count;
     },
   },
   rateLimit: { storage: "secondary-storage" }, // the default once secondaryStorage is set
   ```
3. **Sessions:** defining `secondaryStorage` moves sessions to Redis. To keep the durable
   session row in Postgres (audit + revocation, ADR 0016), set
   `session.storeSessionInDatabase: true`; or go deliberately Redis-only. The 5-min
   `cookieCache` already avoids most per-request session lookups either way.
4. **Tune limits:** `rateLimit.customRules` for sensitive endpoints (sign-in/up default
   3 req / 10s) and `/account-exists`.
5. **Verify:** sign-in brute-force and `/account-exists` enumeration are throttled **across**
   instances, not per-instance.

## Consequences

- Production rate limiting (+ sessions/caching) is effective across instances; the primary DB
  stays free of ephemeral churn.
- One more managed dependency (Redis) **at deploy**; the template carries **no** Redis until
  then.
- Downgrade path: `rateLimit.storage: "database"` is the no-Redis fallback if a deploy target
  can't run Redis.

## Revisit triggers

Deploying to serverless / multi-instance · enabling rate limiting in production · needing
shared sessions or caching.

## Sources

- Better Auth — Rate Limit (storage: memory / database / secondary-storage; enabled by
  default in production) — <https://better-auth.com/docs/concepts/rate-limit>
- Better Auth — secondary storage holds sessions + rate limits; the local
  `better-auth-security-best-practices` skill.

## See also

[0027](0027-backend-architecture-fullstack-and-migration.md) (auth wiring + the
`account-exists` plugin), [0019](0019-data-layer-postgres-drizzle.md) (Postgres = durable
data), and [../future-improvements.md](../future-improvements.md).
