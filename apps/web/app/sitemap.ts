import type { MetadataRoute } from "next";

import { appUrl } from "@workspace/env";

/**
 * Generated at `/sitemap.xml`. Only **public**, indexable URLs belong here — private/auth
 * routes are excluded, and so is `/` while it only redirects (to `/auth` or `/dashboard`,
 * both disallowed in robots.txt). Add path entries as public/marketing pages land, e.g.
 * `{ url: "/pricing", changeFrequency: "monthly", priority: 0.8 }`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages: MetadataRoute.Sitemap = [];
  return publicPages.map((entry) => ({
    ...entry,
    url: `${appUrl}${entry.url}`,
  }));
}
