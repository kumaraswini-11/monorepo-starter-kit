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
