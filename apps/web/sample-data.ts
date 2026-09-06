/**
 * Sample data — TEMPORARY, and safe to delete in one step.
 *
 * This file exists ONLY to populate the UI with realistic placeholder data while the real backends
 * are still being built. Everything here is throwaway: once a real source (a `packages/db` query,
 * an API, a service) is wired, these values are no longer used and this whole file should be
 * deleted.
 *
 * Rules that keep it disposable — do not break them:
 *   • **Nothing depends on this file except the throwaway call sites that feed the UI** (today, the
 *     app-shell layout passes `sampleNotifications` to `<NotificationBell />`). Swapping that one
 *     import for the real source and deleting this file must leave the app fully working.
 *   • **Data only** — no types, no logic, no components. Contracts live with their domain (e.g.
 *     `features/notifications/types.ts`), so removing this file never deletes a type or behaviour.
 *   • **It imports permanent code (types); permanent code never imports from it** (beyond the
 *     throwaway call site). That one-way arrow is what makes deletion side-effect-free.
 *
 * In short: a self-contained bag of placeholder values, removable with zero fallout.
 */

import type { Notification } from "@/features/notifications";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// Computed relative to load time so the demo timestamps read as recent.
const now = Date.now();

// A spread of read/unread, with/without body, actionable/non-actionable, and timestamps ranging
// from minutes to a week — enough to exercise the count badge, empty-vs-list, and relative-time
// buckets. Newest first.
export const sampleNotifications: Notification[] = [
  {
    id: "n1",
    title: "Welcome to the workspace",
    body: "Take a look around — your dashboard is ready.",
    href: "/dashboard",
    read: false,
    createdAt: new Date(now - 3 * MINUTE).toISOString(),
  },
  {
    id: "n2",
    title: "Sarah mentioned you in a comment",
    body: "“Can you take a look at the latest draft when you get a chance?”",
    href: "/settings",
    read: false,
    createdAt: new Date(now - 25 * MINUTE).toISOString(),
  },
  {
    id: "n3",
    title: "New sign-in on a new device",
    body: "If this wasn't you, review your account security.",
    href: "/settings",
    read: false,
    createdAt: new Date(now - 2 * HOUR).toISOString(),
  },
  {
    id: "n4",
    title: "Your weekly report is ready",
    body: "Activity is up 12% from last week.",
    href: "/dashboard",
    read: true,
    createdAt: new Date(now - 5 * HOUR).toISOString(),
  },
  {
    id: "n5",
    title: "Password updated",
    body: "Your password was changed successfully.",
    href: null,
    read: true,
    createdAt: new Date(now - 1 * DAY).toISOString(),
  },
  {
    id: "n6",
    title: "Invitation accepted",
    href: null,
    read: true,
    createdAt: new Date(now - 1 * WEEK).toISOString(),
  },
];
