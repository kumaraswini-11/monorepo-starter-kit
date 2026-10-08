#!/usr/bin/env node
/**
 * Licence policy gate for PRODUCTION dependencies (ADR 0002, ADR 0037).
 *
 * Reads `pnpm licenses list -r --prod --json` from stdin and fails when any shipped package
 * carries a strong-copyleft or unknown licence. The policy:
 * - DENIED: strong copyleft — GPL, AGPL (network clause), SSPL, EUPL, CC-BY-SA — and anything
 *   unknown/unparseable. These are incompatible with a proprietary product.
 * - ACCEPTED: permissive (MIT, ISC, BSD, Apache-2.0, 0BSD, Unlicense, BlueOak, CC0, CC-BY) and
 *   weak copyleft (LGPL, MPL, EPL) for libraries used unmodified, as-is — e.g. libvips (LGPL)
 *   reached through sharp, Next.js's image optimizer.
 * - EXCEPTIONS: a denied licence may be carried temporarily only with an entry below that names
 *   the reason, the owner's decision and the review trigger. Exceptions are reported on every
 *   run (never silently) so they cannot be forgotten.
 *
 * Runs independently of GitHub plan features (the dependency-review PR gate needs GitHub Code
 * Security on private repositories); `pnpm licenses:check` runs it locally and in CI.
 *
 * Usage: pnpm licenses list -r --prod --json | node scripts/check-licenses.mjs
 */
import { readFileSync } from "node:fs";

const DENY = [
  /\bAGPL\b/i,
  /(?<!L)GPL\b/i,
  /\bSSPL\b/i,
  /\bEUPL\b/i,
  /CC-BY-SA/i,
  /\bUNKNOWN\b/i,
  /\bUNLICENSED\b/i,
];

/**
 * Reviewed exceptions — package name -> why it is tolerated and when to revisit.
 * Keep this list short; every entry is a known compliance debt (docs/future-improvements.md).
 * @type {Record<string, { reason: string; review: string }>}
 */
const EXCEPTIONS = {
  "ua-parser-js": {
    reason:
      "Device label ('Browser on OS') in the new-device security email. The free edition of " +
      "2.x is AGPL-3.0; the maintainer chose to keep it for now (2026-10-08) and review later. " +
      "Alternatives recorded: a dependency-free family table, or bowser (MIT).",
    review:
      "Before production launch / legal review (docs/future-improvements.md).",
  },
};

const input = readFileSync(0, "utf8").trim();
if (!input.startsWith("{")) {
  console.error(
    `check-licenses: expected JSON from \`pnpm licenses list -r --prod --json\`, got: ${input.slice(0, 80)}`
  );
  process.exit(2);
}

/** @type {Record<string, Array<{ name: string; versions?: string[] }>>} */
const byLicense = JSON.parse(input);
const violations = [];
const tolerated = [];
for (const [license, packages] of Object.entries(byLicense)) {
  // A compound expression ("Apache-2.0 AND LGPL-3.0-or-later") is judged per clause.
  const clauses = license
    .split(/\s+(?:AND|OR)\s+|[()]/i)
    .map((c) => c.trim())
    .filter(Boolean);
  const denied = clauses.filter((c) => DENY.some((re) => re.test(c)));
  if (!denied.length) continue;
  for (const pkg of packages) {
    const entry = `${pkg.name}@${(pkg.versions ?? []).join("/")}  ${license}`;
    if (EXCEPTIONS[pkg.name]) tolerated.push(entry);
    else violations.push(entry);
  }
}

for (const t of tolerated) {
  const name = t.split("@")[0];
  console.warn(`WARNING licence exception in production: ${t}`);
  console.warn(`        reason: ${EXCEPTIONS[name].reason}`);
  console.warn(`        review: ${EXCEPTIONS[name].review}`);
}
if (violations.length) {
  console.error(
    "Denied licences in production dependencies (ADR 0037 policy):"
  );
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(
  `Licence policy OK: ${Object.values(byLicense).flat().length} production packages, ` +
    `${tolerated.length} reviewed exception(s), no other strong-copyleft or unknown licences.`
);
