import type { MetadataRoute } from "next";

/** Web app manifest, served at `/manifest.webmanifest`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Acme",
    short_name: "Acme",
    description: "Secure, self-hosted authentication starter.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
