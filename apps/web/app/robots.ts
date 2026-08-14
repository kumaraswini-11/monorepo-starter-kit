import type { MetadataRoute } from "next";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/** Generated at `/robots.txt`. Keep private/API surfaces out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
