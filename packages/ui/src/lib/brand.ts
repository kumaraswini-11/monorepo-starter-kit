/**
 * Brand identity — the single source of the product name used in copy, metadata, and
 * accessible labels. Rebrand the template by editing this one file; the visual mark lives
 * in `components/brand/logo.tsx`. Kept a plain constant so both server and client
 * components can import it.
 */
export const brand = {
  /** Product name, lowercase by design. Also the logo's accessible name. */
  name: "efferd",
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
