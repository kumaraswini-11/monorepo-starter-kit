import type { MetadataRoute } from "next";

/** Generated at `/robots.txt`. Keep private/API surfaces out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"],
    },
  };
}
