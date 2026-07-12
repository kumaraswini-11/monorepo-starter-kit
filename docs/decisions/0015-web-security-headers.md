# 0015. Web security headers (baseline) + deferred strict CSP

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The scaffold's `apps/web/next.config.ts` set **no HTTP security headers** — a gap
for an enterprise / future-compliance product. Separately, Base UI needs a nonce
(via its `<CSPProvider>`) to function under a strict Content-Security-Policy (see
[0014](0014-base-ui-adoption.md)). We verified the approach against the
version-local docs (`node_modules/next/dist/docs`, per the AGENTS.md rule);
notably, **Next 16 renamed middleware to _proxy_** (`proxy.ts`,
`export function proxy(...)`) — the mechanism a future nonce would use.

## Decision

### Added now — a security-headers baseline

Set via `headers()` in `apps/web/next.config.ts`, applied to every response.
These carry **no rendering tradeoff** — the app stays statically rendered (build
confirmed routes remain `○ Static`).

| Header                      | Value                                                          | What it does / why                                   |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                 | Forces HTTPS for 2 years, incl. subdomains           |
| `X-Content-Type-Options`    | `nosniff`                                                      | Stops MIME-type sniffing (a XSS/upload vector)       |
| `X-Frame-Options`           | `SAMEORIGIN`                                                   | Clickjacking guard until CSP `frame-ancestors` lands |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                              | Limits referrer info leaked cross-origin             |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disables sensitive browser APIs by default           |
| `X-DNS-Prefetch-Control`    | `on`                                                           | Allows DNS prefetch for faster navigations           |

### Deferred — a strict Content-Security-Policy (+ Base UI `CSPProvider`)

A strict CSP is the bigger, tradeoff-laden piece. The three options:

| Approach                                                           | Security                  | Rendering cost                                      |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------------------- |
| **Nonce** — Next 16 `proxy.ts` per-request nonce + `<CSPProvider>` | Strictest                 | ❌ Forces **all pages dynamic** (no static/CDN/PPR) |
| **SRI** (hash-based, experimental)                                 | Strict                    | ✅ Keeps static + CDN caching                       |
| **Static + `unsafe-inline`**                                       | Weak (defeats much of it) | ✅ Keeps static                                     |

**Decision:** ship the header baseline now; **defer the strict CSP** until
compliance actually requires it, rather than force every page dynamic on day one.
When triggered, re-evaluate nonce vs SRI (SRI preferred if it has stabilized, to
keep static rendering). Base UI's `CSPProvider` is wired as part of that work.

## Consequences

- Every response carries a solid security-headers baseline at zero rendering cost.
- The strict CSP is a conscious, documented deferral — not an oversight — with a
  clear trigger and the Next-16 `proxy.ts` gotcha already recorded.
- `X-Frame-Options` holds the clickjacking line until CSP `frame-ancestors` lands.
