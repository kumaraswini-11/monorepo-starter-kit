import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/shadcn/empty";
import { cn } from "@workspace/ui/lib/utils";

/**
 * A ready-composed empty state: pass an `icon`, `title`, and optional `description` / `action`, and
 * it assembles the shadcn `Empty` parts for you — so no caller re-stitches the header/media/title/
 * description boilerplate or drifts the spacing. `size="sm"` scales the whole thing down for compact
 * surfaces (dropdowns, popovers, small cards); the default is the page/section size.
 *
 * Domain-agnostic by design (ADR 0016 → Component placement): it takes presentational nodes, not a
 * "notifications" or "search" model, so every empty state across the monorepo shares this one
 * component — there is no `NoNotifications` / `NoResults` split duplicating the layout. `children` is
 * the single universal escape hatch (render anything custom after the header); `className` and the
 * raw `Empty*` primitives stay available for a fully-bespoke case. So it is consistent by default yet
 * fully open — the same shape as [AvatarWithFallback].
 *
 * @example
 * <EmptyState size="sm" icon={<BellIcon />} title="No notifications" description="You're all caught up." />
 * <EmptyState icon={<SearchIcon />} title="No results" action={<Button>Clear filters</Button>} />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  className,
  children,
  ...props
}: {
  /** Leading glyph (e.g. a lucide icon). Shown in a muted tile, sized to the chosen `size`. Omit
      for a text-only empty state. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** A call to action (button/link) rendered below the text. */
  action?: ReactNode;
  /** `"default"` for a page/section empty state; `"sm"` for compact surfaces (popovers, cards). */
  size?: "default" | "sm";
  /** Escape hatch: custom content rendered inside the `Empty`, after the header. */
  children?: ReactNode;
} & Omit<ComponentProps<typeof Empty>, "children" | "title">) {
  const sm = size === "sm";
  // Explicitly size the icon for `sm` (default keeps `EmptyMedia`'s own size-6). A size class on the
  // svg also disables the primitive's auto-sizing, and a caller-supplied class still wins (merged
  // last) — so the icon stays overridable.
  const renderedIcon =
    sm && isValidElement<{ className?: string }>(icon)
      ? cloneElement(icon, { className: cn("size-5", icon.props.className) })
      : icon;

  return (
    <Empty className={cn(sm && "gap-3 p-8", className)} {...props}>
      <EmptyHeader>
        {icon != null && (
          <EmptyMedia variant="icon" className={cn(sm && "size-9")}>
            {renderedIcon}
          </EmptyMedia>
        )}
        <EmptyTitle className={cn(sm && "text-sm")}>{title}</EmptyTitle>
        {description != null && (
          <EmptyDescription className={cn(sm && "text-xs")}>
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {action != null && <EmptyContent>{action}</EmptyContent>}
      {children}
    </Empty>
  );
}
