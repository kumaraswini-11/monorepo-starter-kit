import { UAParser } from "ua-parser-js";

/**
 * Helpers that turn raw sign-in metadata into the human-readable strings the
 * new-device security email shows (ADR 0020). Server-side only (auth hooks) — never
 * shipped to the client.
 */

/** Raw user agent → "Browser on OS" (e.g. "Chrome on macOS"). */
export function describeDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const { browser, os } = new UAParser(userAgent).getResult();
  const label = [browser.name, os.name].filter(Boolean).join(" on ");
  return label || "Unknown device";
}

/**
 * Best-effort human location for a sign-in. Prefers geo the edge/proxy already
 * resolved (Vercel/Cloudflare set these headers — no third-party call, so no user IP
 * leaves our infra), then the raw IP, then "Unknown location". A self-hosted deploy
 * can populate the same `x-geo-*` headers at its reverse proxy.
 */
export function resolveLocation(
  headers: Headers | null | undefined,
  ipAddress: string | null | undefined
): string {
  const read = (name: string) => headers?.get(name)?.trim() || undefined;

  const rawCity =
    read("x-vercel-ip-city") ?? read("cf-ipcity") ?? read("x-geo-city");
  const city = rawCity && decodeURIComponent(rawCity);
  const region = read("x-vercel-ip-country-region") ?? read("x-geo-region");
  const country =
    read("x-vercel-ip-country") ??
    read("cf-ipcountry") ??
    read("x-geo-country");

  const geo = [city, region, country].filter(Boolean).join(", ");
  return geo || ipAddress?.trim() || "Unknown location";
}
