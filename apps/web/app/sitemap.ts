import type { MetadataRoute } from "next";

import { appUrl } from "@workspace/env";

/**
 * Generated at `/sitemap.xml`. Only **public** URLs belong here — private/auth routes
 * are intentionally excluded. Expand as public/marketing pages are added.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
