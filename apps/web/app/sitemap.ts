import type { MetadataRoute } from "next";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Generated at `/sitemap.xml`. Only **public** URLs belong here — private/auth routes
 * are intentionally excluded (and stay out of the index). Expand as public/marketing
 * pages are added.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
