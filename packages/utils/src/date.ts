/**
 * Pure, isomorphic date/time helpers — zero dependencies, safe to import from any client or server
 * bundle (`@workspace/utils`, ADR 0016). Built on the platform `Intl` / `Date`, so **no date library
 * (date-fns / dayjs / luxon) is pulled in** for these — see the note on `formatRelativeTime`.
 */

/** Rolling thresholds, smallest → largest, for bucketing a duration into a relative-time unit. */
const DIVISIONS: readonly {
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" }, // avg weeks per month
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * A localized, human relative time — `"3 minutes ago"`, `"in 2 days"`, `"yesterday"` — from an ISO
 * string, epoch-ms number, or `Date`, measured against `now` (default `Date.now()`).
 *
 * Uses the platform `Intl.RelativeTimeFormat` with `numeric: "auto"` (so it says "yesterday", not
 * "1 day ago"), which is exactly why **no date library is needed**: it is zero-dependency and
 * locale-aware for free, and scales from seconds to years. Pass `locale` to pin the language; omit
 * it to follow the runtime. Returns `""` for an invalid/unparseable input, so callers can render
 * nothing rather than "Invalid Date".
 *
 * Note: the output depends on the current clock, so render it only where a server/client hydration
 * mismatch is impossible or acceptable (e.g. a panel that mounts on the client).
 */
export function formatRelativeTime(
  value: string | number | Date,
  { now = Date.now(), locale }: { now?: number; locale?: string } = {}
): string {
  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(time)) {
    return "";
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (time - now) / 1000; // signed seconds: past < 0, future > 0

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }

  // Unreachable — the final division is Infinity — but keeps the return type total.
  return rtf.format(Math.round(duration), "year");
}
