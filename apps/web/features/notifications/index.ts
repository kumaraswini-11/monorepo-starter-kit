/**
 * Public API for the notifications feature (ADR 0028). Other features and routes import from
 * `@/features/notifications` only — never a deep path into this folder. Named re-exports, kept
 * thin. As the feature grows (a `/notifications` page, a `use-notifications` hook, an `actions.ts`
 * seam, a future `@workspace/notifications` domain package), add them to its segments and expose
 * the public ones here — call sites keep importing from this one entry.
 */
export { NotificationBell } from "./components/notification-bell";
export type { Notification } from "./types";
