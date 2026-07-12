# 0006. Community-oriented CONTRIBUTING & SECURITY from established templates

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

We want enterprise-grade contribution and security docs. The project is
**internal-only today** but is expected to **open to external contributors
later** (at which point the license will change — see
[0001](0001-proprietary-license-unlicensed.md)).

## Decision

- **CONTRIBUTING.md** — follow the full [nayafia contributing
  template](https://github.com/nayafia/contributing-template) structure
  (welcoming, community-oriented), populated with this project's real setup.
- **SECURITY.md** — combine the [Eclipse CSI](https://github.com/eclipse-csi/security-handbook)
  "what to include" checklist with a GitHub-style Supported-Versions table and a
  concrete response SLA (72h ack, ~90-day coordinated disclosure).
- **CODE_OF_CONDUCT.md** — keep Contributor Covenant 2.1 (industry standard).

## Consequences

- Docs are contribution-ready ahead of opening up.
- **Aspirational until the license flips:** while the license is `UNLICENSED`,
  the "we welcome contributions" wording has no legal backing. Flipping the
  license (+ adding a CLA) is the switch that makes external contribution real.
- Optional future addition to SECURITY.md: a "Safe Harbor" clause once there is
  a live product.
