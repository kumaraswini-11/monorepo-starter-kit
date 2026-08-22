import type { MetadataRoute } from "next";

import { brand } from "@workspace/ui/lib/brand";

/** Web app manifest, served at `/manifest.webmanifest`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: "Secure, self-hosted authentication starter.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
