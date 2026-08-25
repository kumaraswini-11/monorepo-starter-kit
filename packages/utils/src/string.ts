/**
 * Pure, isomorphic string helpers — zero dependencies, safe to import from any client
 * or server bundle (`@workspace/utils`, ADR 0022). No I/O, no globals, no side effects.
 */

/** Common ASCII/Unicode whitespace: tab–CR (9–13), space (32), non-breaking space (160). */
function isWhitespace(charCode: number): boolean {
  return (
    charCode === 32 || (charCode >= 9 && charCode <= 13) || charCode === 160
  );
}

/**
 * The first whitespace-delimited word of a string — e.g. `"Ada Lovelace"` → `"Ada"`,
 * `"  hello world"` → `"hello"`. Leading whitespace is skipped. Returns `undefined` for
 * empty or whitespace-only input, so callers fall back to their own default rather than
 * an empty string.
 *
 * Complexity: **O(k)** time, where `k` is the offset of the first word boundary — it
 * early-exits at the first whitespace instead of scanning and allocating the whole
 * string the way `text.split(" ")[0]` does. **O(1)** auxiliary space until the single
 * returned slice.
 */
export function firstWord(text: string): string | undefined {
  const length = text.length;

  // Skip any leading whitespace.
  let start = 0;
  while (start < length && isWhitespace(text.charCodeAt(start))) start++;

  // Advance to the next whitespace (or the end) — the end of the first word.
  let end = start;
  while (end < length && !isWhitespace(text.charCodeAt(end))) end++;

  return start === end ? undefined : text.slice(start, end);
}

/**
 * Initials of a name — the first letter of each of the first `max` whitespace-delimited words,
 * uppercased. E.g. `"Ada Lovelace"` → `"AL"`, `"grace hopper"` → `"GH"`, `"Ada"` → `"A"`;
 * `max` (default 2) caps how many, for avatar-style fallbacks. Empty/whitespace-only → `""`.
 *
 * Complexity: **O(k)** time — scans only up to the start of the `max`-th word, taking one letter
 * per word, instead of `split`-ing and allocating the whole string. **O(1)** auxiliary space
 * beyond the small result.
 */
export function getInitials(value: string, max = 2): string {
  const length = value.length;
  let initials = "";
  let i = 0;

  while (i < length && initials.length < max) {
    // Skip whitespace to the start of the next word.
    while (i < length && isWhitespace(value.charCodeAt(i))) i++;
    if (i >= length) break;

    // Take the word's first character, then advance past the rest of the word.
    initials += value.charAt(i).toUpperCase();
    while (i < length && !isWhitespace(value.charCodeAt(i))) i++;
  }

  return initials;
}
