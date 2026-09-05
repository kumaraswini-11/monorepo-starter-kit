/**
 * Pure, isomorphic string helpers — zero dependencies, safe to import from any client or server
 * bundle (`@workspace/utils`, ADR 0016). No I/O, no globals, no side effects. Inputs here are
 * short (names, an email's local part), so we favour clear built-ins over hand-tuned scans.
 */

/**
 * The first whitespace-delimited word of a string — `"Ada Lovelace"` → `"Ada"`,
 * `"  hello world"` → `"hello"`. Returns `undefined` for empty/whitespace-only input, so callers
 * fall back to their own default rather than an empty string. `\S+` treats every Unicode
 * whitespace (incl. the non-breaking space) as a separator.
 */
export function firstWord(text: string): string | undefined {
  return text.match(/\S+/)?.[0];
}

/**
 * Up to `max` uppercase initials for avatar-style fallbacks — the first letter of each of the
 * first `max` whitespace-delimited words, and when there are **fewer words than `max`**, the
 * remaining slots are filled from the first word's next letters. E.g. `"Ada Lovelace"` → `"AL"`,
 * `"grace hopper"` → `"GH"`, `"Ada"` → `"AD"`, `"dev"` → `"DE"`, `"a"` → `"A"`; `max` (default 2)
 * caps the length. Empty/whitespace-only → `""`. Callers pass a name — or another single token,
 * e.g. an email's local part — and get a stable, non-colliding 1–`max`-letter fallback (a bare
 * name-initials helper would reduce every single-token value to one colliding letter).
 */
export function getInitials(value: string, max = 2): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }

  let initials = words
    .slice(0, max)
    .map((word) => word.charAt(0))
    .join("");

  // Fewer words than `max` — top up from the first word's remaining letters ("dev" → "DE").
  if (initials.length < max) {
    initials += words[0]!.slice(1, 1 + max - initials.length);
  }

  return initials.toUpperCase();
}
