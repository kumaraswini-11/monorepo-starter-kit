import { describe, expect, it } from "vitest";

import { describeDevice, resolveLocation } from "@workspace/auth/device";

describe("describeDevice", () => {
  it("derives 'Browser on OS' from a user agent", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(describeDevice(ua)).toBe("Chrome on Windows");
  });

  it("falls back when the user agent is missing", () => {
    expect(describeDevice(undefined)).toBe("Unknown device");
    expect(describeDevice("")).toBe("Unknown device");
  });
});

describe("resolveLocation", () => {
  it("prefers edge geo headers and decodes the city", () => {
    const headers = new Headers({
      "x-vercel-ip-city": "San%20Francisco",
      "x-vercel-ip-country": "US",
    });
    expect(resolveLocation(headers, "203.0.113.5")).toBe("San Francisco, US");
  });

  it("falls back to the IP, then to 'Unknown location'", () => {
    expect(resolveLocation(undefined, "203.0.113.5")).toBe("203.0.113.5");
    expect(resolveLocation(undefined, null)).toBe("Unknown location");
  });
});
