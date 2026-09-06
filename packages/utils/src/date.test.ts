import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./date.js";

// A fixed reference point + locale so assertions are deterministic across machines/timezones.
const now = new Date("2026-09-06T12:00:00.000Z").getTime();
const rel = (value: string | number | Date) =>
  formatRelativeTime(value, { now, locale: "en" });

const ago = (ms: number) => new Date(now - ms).toISOString();
const ahead = (ms: number) => new Date(now + ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("formats recent past across units", () => {
    expect(rel(ago(3 * MINUTE))).toBe("3 minutes ago");
    expect(rel(ago(2 * HOUR))).toBe("2 hours ago");
    expect(rel(ago(5 * DAY))).toBe("5 days ago");
  });

  it("uses word forms via numeric:auto", () => {
    expect(rel(ago(DAY))).toBe("yesterday");
    expect(rel(ahead(DAY))).toBe("tomorrow");
  });

  it("formats the future", () => {
    expect(rel(ahead(2 * DAY))).toBe("in 2 days");
  });

  it("scales up to weeks, months, and years", () => {
    expect(rel(ago(14 * DAY))).toBe("2 weeks ago");
    expect(rel(ago(60 * DAY))).toBe("2 months ago");
    expect(rel(ago(400 * DAY))).toBe("last year");
  });

  it("accepts an ISO string, epoch ms, or Date", () => {
    expect(rel(ago(3 * MINUTE))).toBe("3 minutes ago");
    expect(rel(now - 3 * MINUTE)).toBe("3 minutes ago");
    expect(rel(new Date(now - 3 * MINUTE))).toBe("3 minutes ago");
  });

  it("returns an empty string for an invalid date", () => {
    expect(rel("not-a-date")).toBe("");
  });
});
