import type { ComponentProps, ReactNode } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/shadcn/avatar";
import { getInitials } from "@workspace/utils/string";

/**
 * An avatar that always resolves to something visible: the image once `src` loads, otherwise a
 * fallback. Pass a `name` and it derives initials for you (the Chakra/MUI convention) — so no caller
 * ever re-implements or drifts that rule; pass an explicit `fallback` node (e.g. an icon) to
 * override it.
 *
 * Entity-agnostic by design: it takes a `name`, not a "user", so a person, company, customer, team,
 * or project all use this one component — there is no `UserAvatar` / `CompanyAvatar` split to
 * duplicate the image-or-initials logic. The only per-entity choice — *which field is the name*
 * (`user.name || user.email`, `company.legalName`, …) — stays a one-liner at the call site. Domain
 * knowledge never enters the design system (ADR 0016 → Component placement), so every app in the
 * monorepo shares this single primitive. `size`, `className`, and other `Avatar` props pass through.
 *
 * `name` is a convenient default, not a straitjacket: the `fallback` prop is a single universal
 * escape hatch (a node), so any custom fallback works without new props — the design stays
 * consistent by default yet fully open.
 *
 * @example
 * <AvatarWithFallback name="Dev User" src={img} />                     // → "DU" (default)
 * <AvatarWithFallback alt="Ada B. Cee" fallback={getInitials(n, 3)} /> // → custom initial count
 * <AvatarWithFallback alt="Assistant" fallback={<BotIcon />} />        // → a non-initials fallback
 */
export function AvatarWithFallback({
  name,
  src,
  alt,
  fallback,
  ...props
}: {
  /** Display name of whatever the avatar represents. Used as the default `alt` and, when no
      `fallback` is given, to derive the initials shown while/if the image is unavailable. */
  name?: string | null;
  src?: string | null;
  /** Accessible name for the image. Defaults to `name`. Pass `""` when a text label for the same
      entity sits directly beside the avatar, so screen readers don't announce it twice. */
  alt?: string;
  /** Overrides the derived-initials fallback — e.g. an icon for an unnamed entity. */
  fallback?: ReactNode;
} & Omit<ComponentProps<typeof Avatar>, "children">) {
  const initials = name ? getInitials(name) : "";
  const resolvedFallback = fallback ?? (initials || "?");

  return (
    <Avatar {...props}>
      <AvatarImage src={src ?? undefined} alt={alt ?? name ?? ""} />
      <AvatarFallback>{resolvedFallback}</AvatarFallback>
    </Avatar>
  );
}
