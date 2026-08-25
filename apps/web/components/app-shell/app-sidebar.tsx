"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, SettingsIcon } from "lucide-react";

import { Logo } from "@workspace/ui/components/brand/logo";
import { Avatar, AvatarFallback } from "@workspace/ui/components/shadcn/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/shadcn/sidebar";
import { brand } from "@workspace/ui/lib/brand";

import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * The app's primary navigation (ADR 0022: a feature organism, so it lives in the app, not the
 * design system). Built entirely from the shared shadcn/Base UI `Sidebar` primitives — routing
 * via each button's `render={<Link/>}` (Base UI composition), the active item derived from the
 * pathname, and the identity/sign-out in the footer so they're reachable from every screen.
 */
const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
] as const;

/** Up-to-two initials for the avatar fallback — first letters of two words, else first two chars. */
function initialsOf(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }
  return value.trim().slice(0, 2).toUpperCase() || "?";
}

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname() ?? "";

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label={`${brand.name} — go to dashboard`}
          className="flex items-center rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* The link carries the accessible name; the mark is decorative here. */}
          <Logo className="h-6 w-auto" aria-hidden="true" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
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
                      render={<Link href={item.href} />}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback>
              {initialsOf(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
