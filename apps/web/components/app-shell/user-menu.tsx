"use client";

import { useState } from "react";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";

import { AvatarWithFallback } from "@workspace/ui/components/avatar/avatar-with-fallback";
import { Button } from "@workspace/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn/dropdown-menu";

import { ThemeRadioGroup } from "@/components/theme/theme-radio-group";
import { useSignOut } from "@/lib/auth/use-sign-out";

/**
 * Account menu in the app header (ADR 0023): an avatar button that opens the user's identity, the
 * theme control (Light / Dark / System — nested here rather than a standalone header toggle, the
 * common account-menu pattern), and sign-out. A client island so the header + pages stay
 * server-rendered. Sign-out goes through the shared `useSignOut` seam; on failure it toasts and
 * stays put — a failed sign-out must never navigate away and leave a live session behind an auth
 * screen.
 */
export function UserMenu({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) {
  const runSignOut = useSignOut();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    // On success the app navigates to /auth (this menu unmounts); only re-enable on failure.
    if (!(await runSignOut())) {
      setPending(false);
    }
  }

  // `name` drives both the initials fallback and the image alt. Email as the name source for
  // name-less users (this app is email-first). `alt=""` because a text label sits beside the avatar
  // in the menu and the trigger button is already labelled — so the image is decorative here.
  const userAvatar = (
    <AvatarWithFallback
      name={user.name || user.email}
      src={user.image}
      alt=""
    />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Account menu"
          >
            {userAvatar}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            {userAvatar}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Theme lives here (three-state, ADR 0023) rather than a standalone header toggle;
            the quick ⌘⇧L flip and the ⌘K palette also change it. */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunIcon className="dark:hidden" aria-hidden="true" />
            <MoonIcon className="hidden dark:block" aria-hidden="true" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <ThemeRadioGroup />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {/* Default (not destructive) — sign-out is reversible; red is reserved for irreversible
            loss (ADR 0020). */}
        <DropdownMenuItem disabled={pending} onClick={onSignOut}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
