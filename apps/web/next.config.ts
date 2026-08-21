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
  // React Compiler: auto-memoizes components (fewer re-renders at runtime) at the
  // cost of a slightly slower Babel compile step. Needs babel-plugin-react-compiler.
  // (ADR 0023)
  reactCompiler: true,
  // Cache Components (stable, Next 16): PPR by default — static shell streams
  // immediately, dynamic (cookies/headers) content streams under Suspense, and
  // `use cache` opts data into caching. See ADR 0023. Dynamic access must sit under
  // a Suspense boundary (we provide segment `loading.tsx` files).
  cacheComponents: true,
  // Don't advertise the framework/version (small info-leak reduction).
  poweredByHeader: false,
  // Type-safe <Link> hrefs + router pushes — checked against real routes at build.
  // (/terms + /privacy are external links to the marketing site, so they don't count.)
  typedRoutes: true,
  // Images: `next/image` already optimizes local images (AVIF/WebP) with no config.
  // Add remote hosts + formats here when the app first loads external images:
  //   images: {
  //     formats: ["image/avif", "image/webp"],
  //     remotePatterns: [{ protocol: "https", hostname: "images.example.com" }],
  //   },
  transpilePackages: [
    "@workspace/ui",
    "@workspace/auth",
    "@workspace/db",
    "@workspace/email",
    "@workspace/env",
    "@workspace/utils",
  ],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
