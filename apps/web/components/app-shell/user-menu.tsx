"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@workspace/ui/components/shadcn/avatar";
import { Button } from "@workspace/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn/dropdown-menu";
import { toast } from "@workspace/ui/components/shadcn/toast";
import { getInitials } from "@workspace/utils/string";

import { signOut } from "@/lib/auth/actions";

/**
 * Account menu in the app header (ADR 0025): an avatar button that opens a dropdown showing the
 * user's identity, then a destructive sign-out. A client island so the header + pages stay
 * server-rendered. Sign-out goes through the seam (lib/auth/actions); on failure it toasts and
 * stays put — a failed sign-out must never navigate away and leave a live session behind an auth
 * screen.
 */
export function UserMenu({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await signOut();
      router.push("/auth");
      router.refresh();
    } catch {
      toast.add({
        title: "Couldn't sign you out",
        description: "Please try again.",
        type: "error",
        timeout: 0,
        priority: "high",
      });
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              <AvatarFallback>
                {getInitials(user.name || user.email) || "?"}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {/* Base UI ties a menu label to its group, so the identity block must live inside a
            DropdownMenuGroup — a bare DropdownMenuLabel throws "MenuGroupContext is missing".
            The label's base class is muted, so the name is re-asserted as foreground for hierarchy. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">
              {user.name}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={onSignOut}
        >
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
