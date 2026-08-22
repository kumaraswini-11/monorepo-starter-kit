// Public surface of @workspace/db: domain schema (table defs), repository functions, and
// types. The raw Drizzle handle (`db`) + `pool` + the `schema` namespace live ONLY on the
// `./client` (adapter) subpath, consumed solely by @workspace/auth's drizzleAdapter — so
// the ADR 0019 "single data-access choke-point" is structural, not just convention.
export * from "@workspace/db/schema";
export type { Database } from "@workspace/db/client";
export { getUserById } from "@workspace/db/queries/users";
export { isNewDeviceSignIn } from "@workspace/db/queries/sessions";
