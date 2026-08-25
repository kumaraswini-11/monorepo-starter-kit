import { describe, expect, it } from "vitest";

import { firstWord, getInitials } from "./string.js";

describe("firstWord", () => {
  it("returns the first whitespace-delimited word", () => {
    expect(firstWord("Ada Lovelace")).toBe("Ada");
  });

  it("skips leading whitespace", () => {
    expect(firstWord("  hello world")).toBe("hello");
  });

  it("treats non-breaking space as whitespace", () => {
    expect(firstWord(" Ada")).toBe("Ada");
  });

  it("returns undefined for empty or whitespace-only input", () => {
    expect(firstWord("")).toBeUndefined();
    expect(firstWord("   ")).toBeUndefined();
  });
});

describe("getInitials", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("grace hopper")).toBe("GH");
  });

  it("caps at `max` words (default 2)", () => {
    expect(getInitials("Ada King Lovelace")).toBe("AK");
    expect(getInitials("Ada King Lovelace", 3)).toBe("AKL");
  });

  it("returns a single initial for a one-word value", () => {
    expect(getInitials("Ada")).toBe("A");
  });

  it("ignores extra/leading whitespace", () => {
    expect(getInitials("  ada   lovelace  ")).toBe("AL");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});
