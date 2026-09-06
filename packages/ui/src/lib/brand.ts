import { PRODUCT_NAME } from "@workspace/utils/product";

/**
 * Brand identity for the app UI — product name + legal links used in copy, metadata, and accessible
 * labels. The product **name** is sourced from `@workspace/utils/product` (the shared leaf) so the
 * email package reads the same value without importing this UI package — no drift (ADR 0016). The
 * visual mark lives in `components/brand/logo.tsx`. Plain constants so both server and client
 * components can import them.
 */
export const brand = {
  /** Product name (lowercase by design), also the logo's accessible name. Single source: utils. */
  name: PRODUCT_NAME,
  /**
   * Legal / policy pages — external (marketing site or a legal-doc host). Named rather
   * than derived from a base URL: legal URLs rarely share a uniform path and the set grows
   * (cookie policy, DPA, …). Point each at its real URL; replace when you rebrand.
   */
  legal: {
    terms: "https://example.com/terms",
    privacy: "https://example.com/privacy",
  },
} as const;
