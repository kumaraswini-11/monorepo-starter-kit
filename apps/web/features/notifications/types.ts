import type { Route } from "next";

/**
 * A notification as the UI renders it — deliberately minimal so any source can satisfy it: a real
 * query / API / service later, or the throwaway `sample-data.ts` today. This is the **permanent
 * contract** (components and the future backend both depend on it); the *data* lives elsewhere, so
 * deleting the sample file never removes this type.
 */
export type Notification = {
  id: string;
  title: string;
  body?: string;
  /** Where clicking navigates, or `null` for a non-actionable one. Typed `Route` so it stays
   *  type-checked (typedRoutes, ADR 0019). */
  href?: Route | null;
  read: boolean;
  /** ISO-8601 timestamp. */
  createdAt: string;
};
