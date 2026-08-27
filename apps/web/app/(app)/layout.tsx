import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Separator } from "@workspace/ui/components/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/shadcn/sidebar";

import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppSidebarTrigger } from "@/components/app-shell/app-sidebar-trigger";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { UserMenu } from "@/components/app-shell/user-menu";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { getSession } from "@/lib/session";

/**
 * The authed area reads the session (`headers()`) on every request, so it's dynamic with
 * no useful static shell. `instant = false` opts this segment out of instant-navigation
 * validation (Cache Components / ADR 0019) — it deliberately blocks on the server guard.
 * Public pages (`/auth`) stay static and stream normally.
 */
export const instant = false;

/**
 * Authenticated app shell. Guards the session on the server (no auth flash; redirect before any
 * bytes), then wraps every authed page in the shadcn `Sidebar` shell. `getSession()` is
 * `cache()`-memoized, so this lookup is shared with the page it wraps (one call per request).
 *
 * The sidebar's open/collapsed state persists across reloads via the `sidebar_state` cookie —
 * read here so the server renders the correct initial state (no flash/hydration mismatch).
 * Global controls live in the shell header (theme toggle + the account menu, which holds sign-out)
 * so they're reachable from every page, including Settings.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <AppSidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-center"
          />
          <AppBreadcrumb />
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <UserMenu user={user} />
          </div>
        </header>

        {!session.user.emailVerified && (
          <VerifyEmailBanner email={session.user.email} />
        )}

        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
