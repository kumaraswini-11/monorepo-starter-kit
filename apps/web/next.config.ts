import type { NextConfig } from "next";

/**
 * Baseline security headers, applied to every response.
 *
 * These carry NO rendering tradeoff. A full Content-Security-Policy is
 * deliberately deferred to an ADR, because the strict (nonce-based) form forces
 * every page into dynamic rendering — losing static optimization, CDN caching,
 * and PPR. `X-Frame-Options` is the no-tradeoff clickjacking guard until that
 * CSP `frame-ancestors` decision is made.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
