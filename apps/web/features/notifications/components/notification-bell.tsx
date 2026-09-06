"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { EmptyState } from "@workspace/ui/components/empty-state/empty-state";
import { Badge } from "@workspace/ui/components/shadcn/badge";
import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/shadcn/item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/shadcn/popover";
import { cn } from "@workspace/ui/lib/utils";
import { formatRelativeTime } from "@workspace/utils/date";

import type { Notification } from "../types";

/**
 * Header notification bell (ADR 0023 app shell). A `Popover` — rich, scrollable content, not a menu
 * of actions — with an unread dot, mark-all-read, per-item read state, and an `Empty` state.
 * Data arrives as a prop (fed by the app-shell layout), so the component is source-agnostic. Read
 * state is optimistic + local for now; a real backend swaps the mutations for server actions with
 * no change to this contract.
 */
export function NotificationBell({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            className="relative rounded-full"
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
          >
            <BellIcon aria-hidden="true" />
            {/* A dot, not a count: a notifications bell signals "something new", where the exact
                number doesn't drive triage (unlike @mentions/tasks). The precise count stays in the
                button's aria-label for screen readers. The ring separates the dot from the icon. */}
            {unread > 0 && (
              <span
                aria-hidden="true"
                className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background"
              />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Notifications</p>
            {/* The precise count lives here, inside the panel, where it drives triage — the bell
                itself only shows a dot. A compact pill: min-w so a single digit reads as a circle,
                tabular-nums so multi-digit counts stay aligned. */}
            {unread > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center px-1.5 tabular-nums"
              >
                {unread}
              </Badge>
            )}
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              <CheckCheckIcon aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            size="sm"
            className="border-0"
            icon={<BellIcon aria-hidden="true" />}
            title="No notifications"
            description="You're all caught up."
          />
        ) : (
          // scroll-fade-y + no-scrollbar are shadcn shared utilities (via `shadcn/tailwind.css`):
          // a soft top/bottom fade signals more content while the scrollbar stays hidden.
          <ul className="no-scrollbar max-h-96 scroll-fade-y overflow-y-auto p-1">
            {items.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onActivate={markRead} />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onActivate,
}: {
  notification: Notification;
  onActivate: (id: string) => void;
}) {
  const { id, title, body, href, read, createdAt } = notification;

  return (
    // shadcn `Item` (size sm) rendered as the row's interactive element — a Link when the
    // notification navigates, a button otherwise. The `default` variant is ghost (transparent,
    // border-transparent); `hover:bg-muted` matches the ghost Button so all shell affordances
    // hover alike. Focus ring is built into `Item`. `text-start` neutralizes the UA `<button>`
    // default `text-align:center` (the non-navigating rows render as buttons) so the full-width
    // <time> stays left-aligned like the anchor rows.
    <Item
      size="sm"
      className="text-start hover:bg-muted"
      render={href ? <Link href={href} /> : <button type="button" />}
      onClick={() => onActivate(id)}
    >
      <ItemMedia>
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            read ? "bg-transparent" : "bg-primary"
          )}
        />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle>
          {title}
          {!read && <span className="sr-only"> (unread)</span>}
        </ItemTitle>
        {body && <ItemDescription className="text-xs">{body}</ItemDescription>}
        {/* Rendered only inside the open (client-mounted) panel, so the clock-dependent output
            can't cause an SSR/hydration mismatch. */}
        <time dateTime={createdAt} className="text-xs text-muted-foreground/80">
          {formatRelativeTime(createdAt)}
        </time>
      </ItemContent>
    </Item>
  );
}
