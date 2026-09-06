import type { Route } from "next";
import {
  LayoutDashboardIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Primary app navigation — the single source for the sidebar, the header breadcrumb, and the
 * command palette. Add a route here and all three pick it up (ADR 0023). `href` is a typed
 * `Route` so `<Link>` / `router.push` stay type-checked (typedRoutes, ADR 0019).
 */
export type NavItem = { title: string; href: Route; icon: LucideIcon };

export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

/** Whether `href` is the active nav target for `pathname` — exact match, or a nested child route. */
export function isActiveNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The nav item matching `pathname` (exact or nested), or `undefined` when off-nav. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActiveNav(pathname, item.href));
}
