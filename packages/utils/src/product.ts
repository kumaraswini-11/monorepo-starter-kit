/**
 * Product identity constants shared across packages — the leaf home (below both `@workspace/ui` and
 * `@workspace/email` in the dependency graph, ADR 0016) so the email package, which must not import
 * the UI design system, and the app UI both read one value with no drift. Named `product` (not
 * `brand`) to avoid clashing with the UI's `brand.ts`, which layers the marks + legal links on top.
 * Rebrand the product by editing this one line.
 */
export const PRODUCT_NAME = "efferd";
