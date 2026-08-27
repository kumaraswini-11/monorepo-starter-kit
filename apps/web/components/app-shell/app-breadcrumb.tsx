"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/shadcn/breadcrumb";

import { NAV_ITEMS } from "@/components/app-shell/nav";

/**
 * Header breadcrumb — a "you are here" anchor in the (sticky) header, so it survives scroll and
 * fills what would otherwise be dead space (ADR 0023). Minimal for now: a single crumb resolved
 * from the active nav item; extend to a real trail once nested routes exist.
 */
export function AppBreadcrumb() {
  const pathname = usePathname() ?? "";
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (!current) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{current.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
