"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo, LogoIcon } from "@workspace/ui/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/shadcn/sidebar";
import { brand } from "@workspace/ui/lib/brand";

import { NAV_ITEMS } from "@/components/app-shell/nav";

/**
 * The app's primary navigation (ADR 0016: a feature organism, so it lives in the app, not the
 * design system). Built from the shared shadcn/Base UI `Sidebar` primitives: routing via each
 * button's `render={<Link/>}` (Base UI composition), the active item from the pathname, and
 * `collapsible="icon"` so it collapses to an icon rail (not fully offscreen) — tooltips surface
 * each label in that state. Nav items come from the shared `NAV_ITEMS` (shared with the header
 * breadcrumb + command palette). The user/account menu lives in the header (see `UserMenu`).
 */
export function AppSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label={`${brand.name} — go to dashboard`}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          {/* The link carries the accessible name; the marks are decorative. Show the compact
              mark when collapsed to the icon rail, the full wordmark when expanded. */}
          <LogoIcon
            className="hidden size-5 shrink-0 group-data-[collapsible=icon]:block"
            aria-hidden="true"
          />
          <Logo
            className="h-6 w-auto group-data-[collapsible=icon]:hidden"
            aria-hidden="true"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Primary navigation landmark + aria-current on the active link. The shadcn Sidebar
                primitive is content-agnostic (plain divs; visual-only `isActive`), so the app owns
                these page-level semantics — deliberate, not a gap (ADR 0020, 0023). */}
            <nav aria-label="Main">
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={
                          <Link
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                          />
                        }
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
