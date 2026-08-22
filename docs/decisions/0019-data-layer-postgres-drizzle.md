# 0019. Data layer — PostgreSQL + Drizzle; database portability & lock-in strategy

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Implementing the Better Auth foundation ([0016](0016-authentication-strategy.md))
forced a full evaluation of the **data layer** — the foundation the whole app (not
just auth) sits on. Each question below carried a common assumption worth
**verifying, not trusting**:

1. **Why a database of this kind at all** — relational (PostgreSQL) vs NoSQL?
2. **ORM vs raw SQL** — what do enterprises actually use, and is _"big companies use
   raw SQL, no ORM"_ true?
3. **Database-agnosticism** — should the app be built so we can _swap the database
   later_ (e.g. PostgreSQL → MongoDB → Azure Cosmos DB) to avoid vendor lock-in?
4. **Which access library** (Drizzle / Prisma / Kysely), and **self-host vs managed**
   (Neon)?
5. **Scale, isolation, and enterprise standards** — how does this scale to millions,
   stay isolated/replaceable, and meet compliance-grade operational bars?

### How we decided

Per the repo methodology ([0005](0005-follow-shadcn-baseline.md)), the analysis was
produced by **six parallel, internet-wide research passes** against **official
documentation + reputable engineering sources**; the verdicts below cite them (full
list in _Sources_). Because Better Auth is already chosen
([0016](0016-authentication-strategy.md)), its supported adapters also **bound** how
portable the _auth_ store can be.

## Questions & critiques interrogated

This decision came from challenging assumptions out loud rather than accepting
defaults. Each item records a belief we explicitly pressure-tested:

- **"Why relational / Postgres — why not NoSQL?"** Critique: is a SQL database even
  the right paradigm for a modern, scale-to-millions product?
- **"Big companies just use raw SQL, no ORM — should we skip the ORM?"** Critique:
  ORMs are heavyweight / slow / leaky at scale; is raw SQL the "real" enterprise
  choice?
- **"Enterprise apps are built database-agnostic so we can swap to Mongo/Cosmos
  later — isn't that how it's done?"** Critique: are we locking ourselves in by
  committing to one database?
- **"Why conclude Drizzle specifically? And why Neon?"** Critique: don't hand-wave the
  library/host choice — justify it or reconsider.
- **"If we change the DB later, can we just drop `packages/db` and swap it, without
  touching the rest of the codebase?"** Critique: is the data layer truly isolated?
- **Constraint** — Better Auth ([0016](0016-authentication-strategy.md)) is fixed; its
  adapters set the outer bound on where the _auth_ tables can live.

## Scope & non-goals

- **In scope:** the DB **engine** (and _why_ relational), the **data-access** library,
  the **portability / lock-in** and **isolation** strategy, **hosting** (self-host vs
  managed), the **scalability** roadmap, and **enterprise operational standards**.
- **Out of scope** (decided separately — the auth implementation plan / a later ADR):
  environment-variable management, the Better Auth **runtime** config (secret,
  sessions, cookies, email delivery, rate limiting), and the concrete table schema.

## Decision

- **DB engine — PostgreSQL.** A relational, ACID, transactional store is the right fit
  for our data (users/auth/orgs/roles/billing); Postgres is open, standards-based, and
  runnable on self-host **and** every major cloud → inherently **low lock-in**.
- **Data access — Drizzle** (a **typed query builder**, not a heavy ORM) over the
  plain **`pg` (node-postgres)** driver; **Drizzle Kit** for migrations. **Kysely** is
  the documented fallback (Better Auth's _built-in_ adapter). **Prisma is rejected.**
- **Isolation — `packages/db` is the single, one-way data-access boundary.** It is the
  _only_ package that imports `drizzle-orm`/`pg`; everything else depends on its
  exported API, never on Drizzle/`pg` directly.
- **Portability strategy** — commit to the SQL/Postgres paradigm; use the boundary for
  **testability + a single choke-point + a contained blast radius**, **not** to chase
  cross-paradigm swaps. Use Postgres's full power (joins, constraints, JSONB,
  transactions) rather than a lowest-common-denominator subset.
- **Hosting** — **self-host PostgreSQL as the production system-of-record**
  (compliance / own-the-data, per [0016](0016-authentication-strategy.md)); **docker
  Postgres for local dev**; **Neon acceptable & reversible** for dev/preview. Keep the
  app on the plain `pg` driver (**not** Neon's serverless driver) so identical
  Drizzle-over-`pg` code runs unchanged on self-host _or_ Neon.
- **Polyglot escape hatch** — add a specialized store (Redis, search, analytics)
  _alongside_ Postgres only when a concrete, evidenced access pattern justifies it.

## Options considered

| Axis        | Chosen                                         | Considered & rejected (why)                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine**  | **PostgreSQL** ✅                              | **MySQL** — fine, no advantage here + weaker JSON/extensions. **SQLite** — great dev/edge, not prod scale/concurrency. **MongoDB / Cosmos DB** ❌ — different paradigm (a rewrite, not a swap) + Cosmos is Azure-only.             |
| **Access**  | **Drizzle** ✅ (typed query builder over `pg`) | **Kysely** — thinnest, Better Auth's built-in; kept as **fallback** but no schema/migration tooling for our own tables. **Prisma** ❌ — heaviest lock-in (PSL + codegen + migration format). **Raw SQL only** ❌ — injection risk. |
| **Hosting** | **Self-host (prod)** ✅ + **docker (dev)**     | **Neon / managed** — acceptable & **reversible** for dev/preview (standard Postgres); deferred for prod on compliance grounds. **Cosmos / DynamoDB** ❌ — single-cloud lock-in.                                                    |

## Why relational (PostgreSQL) over NoSQL

**Verdict: relational is the correct system-of-record for this workload; NoSQL is a
targeted tool, added alongside only when justified.**

- **The paradigms trade differently.** NoSQL's families (document, key-value,
  wide-column, graph) are largely _aggregate-oriented_ — optimized for storing/reading
  self-contained blobs by one key, deliberately sacrificing cross-aggregate joins
  (Fowler/Sadalage). This maps onto **ACID vs BASE**: relational engines default to
  strong consistency + multi-row transactions; distributed NoSQL defaults to eventual
  consistency to buy horizontal scale. **CAP/PACELC**: a single-primary Postgres avoids
  the partition-time divergence a distributed store must reconcile.
- **Our data is relational and transactional.** Users belong to organizations →
  teams → members → roles → permissions; subscriptions/invoices reference all of them.
  That is joins + foreign-key integrity + multi-row ACID (a billing ledger's
  debit/credit/entry must all commit or none). AWS's own guidance puts the relational
  sweet spot at **ad-hoc queries** over a **normalized schema with relationships** —
  exactly RBAC reporting, invoice reconciliation, and tenant-isolation queries.
- **When NoSQL genuinely wins:** massive scale-out writes, a single known access
  pattern (key lookup), unstructured/variable payloads, or global low-latency
  multi-region writes (AWS cites DynamoDB for social/gaming/IoT at 100k+ writes/s).
  Not our profile.
- **Postgres already covers many "document" needs** via **`jsonb`** (GIN-indexed,
  JSONPath) — the docs say _"most applications should prefer jsonb"_ — so schema-
  flexible per-tenant fields live in a column without a second database.

## Q1 — ORM vs raw SQL: the ideal, scalable, enterprise approach

**Verdict: _"big companies use raw SQL, no ORM"_ is half-true, half-myth.** The
spectrum runs raw SQL → **typed query builders** (Drizzle, Kysely, jOOQ, sqlc) →
**heavy ORMs** (Prisma, TypeORM, Hibernate).

- Heavy ORMs risk **N+1 queries and opaque SQL** at scale — one benchmark measured a
  relational fetch at **Kysely ~50 ms, Drizzle ~75 ms, Prisma ~110 ms** (Prisma's
  `relationJoins` preview _worse_ at ~240 ms). N+1 is invisible in dev, painful in prod.
- But serious teams **do not** hand-write bare string SQL either (injection). "Raw" in
  practice means **parameterized queries via a builder/data-mapper**. Even **Prisma
  shipped _TypedSQL_**, conceding raw SQL is the right tool for hot paths.

→ **The enterprise-ideal for TS + Postgres is a thin, type-safe query builder** —
effectively _typed raw SQL_: every query is visible, tunable, auditable, and
auto-parameterized, with no N+1-by-default; drop to a raw `sql` template for
complex/hot paths. **The anti-pattern isn't "ORM" — it's _any_ layer whose emitted SQL
you can't see, tune, or audit.**

## Q2 — Database-agnosticism & vendor lock-in

**Verdict: the "build it swappable to Mongo/Cosmos" belief is largely a myth /
anti-pattern.**

- Cross-paradigm swaps (SQL ↔ document) almost never happen, and when they do it is a
  **rewrite regardless** — data model, query language, transactions, and consistency
  differ fundamentally. Designing _for_ the swap forces **lowest-common-denominator**
  code that forfeits Postgres's real strengths (a textbook **leaky / premature
  abstraction**).
- The **Repository / hexagonal (ports & adapters)** pattern is genuinely valuable — but
  for **testability, domain isolation, and a single data-access choke-point**, **not**
  for free database swaps (Fowler / Cockburn / Microsoft DDD).
- Enterprises manage lock-in by **choosing an open, portable engine**, not by
  abstracting the app: **PostgreSQL runs everywhere**, while **Cosmos DB is Azure-only**
  and **DynamoDB is AWS-only** — _those_ are the real lock-in traps.

→ **The goal (avoid lock-in) is right; the method (swap to Mongo/Cosmos) is wrong.**
Commit to PostgreSQL — it already delivers low lock-in — and isolate data access behind
`packages/db` (next section) for testability. Better Auth also bounds the _auth_ store
to its adapters (**PostgreSQL / MySQL / SQLite / MSSQL** + an official **MongoDB**
adapter), so switching the auth database _within that set_ is a config change.

## Q3 — Drizzle vs Prisma vs Kysely; Neon vs self-host

**Better Auth adapter envelope (official docs):** built-in **Kysely** (Postgres /
MySQL / SQLite / MSSQL — the only adapter that runs programmatic migrations / emits a
SQL file), the **Drizzle** adapter (CLI generates a Drizzle schema; migrate with
Drizzle Kit), the **Prisma** adapter, and an official **MongoDB** adapter. On Postgres
the auth schema is identical regardless of library → the auth layer does not lock us to
a specific access library.

| Axis                 | **Drizzle**                   | **Prisma**                                      | **Kysely**                     |
| -------------------- | ----------------------------- | ----------------------------------------------- | ------------------------------ |
| Model                | Code-first TS schema (infers) | Codegen from proprietary PSL schema             | Infers from a TS DB interface  |
| Weight               | ~0 deps, tiny, no engine      | Client + (historically) engine; v7 WASM ~1.6 MB | ~8 KB, no engine               |
| Raw-SQL escape hatch | `sql` operator                | `$queryRaw` / TypedSQL (bolted on)              | `sql` tag — it _is_ SQL-shaped |
| Migrations           | Drizzle Kit                   | Prisma Migrate (declarative)                    | Programmatic code migrations   |
| **Relative lock-in** | **Low**                       | **Highest** (PSL + codegen + migration fmt)     | **Lowest**                     |

**Relative lock-in: Kysely < Drizzle < Prisma.** Drizzle wins: the thin, SQL-first,
type-safe builder Q1 points to, a first-class Better Auth adapter, zero-dependency/tiny
(serverless-friendly), schema-as-code + Drizzle Kit migrations + a relations API, and
**low lock-in**. **Kysely** is the principled thinner runner-up (Better Auth's built-in,
no extra dep) — but has **no schema/migration tooling** for our **non-auth** tables,
which Drizzle provides. **Prisma** is the heaviest lock-in → avoided.

**Neon** is **just serverless Postgres** — same wire protocol, `postgresql://` strings,
extensions, and `pg_dump`/`pg_restore`. **Data lock-in is low**; the proprietary parts
(branching, autoscaling, serverless driver) are _convenience_, not your data. The
trade-off is compliance (Neon is a third-party processor) vs self-hosting (full
custody/residency, at the cost of HA/backups/patching). → **Self-host in prod; Neon
reversible for dev/preview; stay on the plain `pg` driver so nothing couples us to Neon.**

## Isolation & the `packages/db` boundary

**Design intent: the data layer is a one-way, replaceable boundary.**

- **`packages/db` is the _only_ package that imports `drizzle-orm` / `pg`.** `apps/web`
  and the business logic in `packages/auth` depend **only** on `@workspace/db`'s
  exported API (repositories + domain types) — never on Drizzle/`pg` directly. The
  dependency arrow points **one way**, into `packages/db`.
- **Same-paradigm change → true "drop-and-replace the folder."** Swap Drizzle → Kysely,
  swap the `pg` driver, move self-host → Neon → RDS, even Postgres → another SQL engine:
  rewrite `packages/db` **internals**, and consumers stay untouched because the exported
  interface is stable.
- **Cross-paradigm change (→ Mongo/Cosmos) is _contained_, not _free_.** The boundary
  shrinks the blast radius (rewrite `packages/db`, not the whole app), but the interface
  encodes relational semantics (transactions, relations); a document store may not
  honor the same contract, so _some_ call-site logic can still need rework. Isolation is
  for blast-radius, not magic (see Q2).
- **One exception:** Better Auth talks to the DB through _its own_ adapter
  (`drizzleAdapter(db)`), not our repository — that coupling lives inside
  `packages/auth` and swaps via Better Auth's adapter set. To keep that exception from
  becoming a general escape hatch, the raw Drizzle handle (`db`), `pool`, and the `schema`
  namespace are exported **only** from the narrow `@workspace/db/client` (adapter) subpath —
  **not** the default `@workspace/db` barrel, which exposes repositories + domain types. So
  the choke-point below is structural (a consumer would have to import the adapter subpath by
  name), not merely convention.
- **Cost (named deliberately):** consumers can't write ad-hoc Drizzle queries inline —
  they go through `packages/db`'s API. A little more boilerplate, and some of Drizzle's
  inline ergonomics traded away, in exchange for the drop-in replaceability above.

### Query organization — per-aggregate modules, not one file

Queries live in `src/queries/`, **one module per aggregate** (`users.ts`,
`sessions.ts`, … later `billing.ts`, `notifications.ts`), exported via a
`./queries/*` subpath; the package barrel re-exports for convenience. A single
`queries.ts` doesn't scale — it becomes a merge-conflict magnet and hard to navigate.
Aggregate-oriented modules mirror business boundaries and keep granularity
consistent, the widely-recommended shape for a growing Drizzle data layer
(repository-per-aggregate; see _Sources_). Schema stays single-file for now (all four
tables are one bounded context — auth-core); split `schema/` by domain when a second
context lands. A tenant-aware repository base is the natural extension when B2B
multi-tenancy arrives.

## Scaling to millions

**Governing principle:** escalate only on a _measured_ bottleneck, and know which one.
Real-world anchor: OpenAI reportedly runs ChatGPT (~800M users) on a **single unsharded
Postgres primary + ~50 read replicas**, finding **write load — not read scalability —
is the real ceiling**; sharding was the last resort. The ladder (cheap → expensive):

1. **Tuning first, always** — indexing + query plans (`EXPLAIN ANALYZE`), fresh stats,
   `work_mem`/`shared_buffers`/`max_wal_size`, then right-size the box.
2. **Connection pooling (near-mandatory for a serverless/multi-instance `pg` app)** —
   Postgres forks a process per connection (`max_connections` ~100); put **PgBouncer**
   (transaction mode) or a managed pooler (RDS Proxy / Neon / Supabase) in front.
3. **Read replicas + read/write splitting** — Drizzle's **`withReplicas()`** routes
   reads to replicas, writes to primary; use `$primary` for read-after-write (lag).
4. **Caching layer (cheap, high impact)** — **Redis** for hot reads, sessions, and
   rate-limit counters; point **Better Auth "secondary storage"** at it to move sessions
   - rate limits off the primary. _(This is the future "Redis" layer.)_
5. **Native partitioning** — RANGE/LIST/HASH when one table outgrows RAM / is
   time-series. Still single-node (not horizontal scale).
6. **Horizontal sharding — Citus** (Postgres extension, shard by `org_id`/`user_id`) —
   last resort; highest operational + app cost.
7. **CQRS / dedicated read models** — only for specific search/analytics workloads.

**Roadmap:** _Now_ — tuning + pooling. _Next_ — Redis (Better Auth secondary storage) +
read replicas. _Later_ — partitioning. _Defer until proven_ — sharding / CQRS.

> Honest caveat (carried from [0016](0016-authentication-strategy.md)): "scales to
> millions" is a reasonable **inference** from Postgres's track record + these levers,
> **not** a benchmark of our stack. Validate with load tests before betting a launch.

## Enterprise standards & best practices

Compliance raises the bar from "works" to "provable, least-privilege, recoverable,
auditable." Consensus across the PostgreSQL manual, OWASP, and AWS/Azure well-architected
guidance:

**Day-1 (non-negotiable at launch):**

- App connects as a **non-superuser, least-privilege role** (no `BYPASSRLS`); separate
  roles per purpose (read/write/migrate/monitor) and per environment.
- **TLS in transit** (`hostssl`, client `sslmode=verify-full`, TLS 1.2+) + **encryption
  at rest**.
- **Credentials in a secrets manager**, never in code/repo (cf. our `.env` discipline).
- **Row-Level Security** on every tenant-scoped table — `ENABLE` **and** `FORCE ROW
LEVEL SECURITY` (owners bypass RLS by default), policy keyed on the tenant id.
- **Versioned, forward-only migrations**, reviewed and run in CI (Drizzle Kit).
- **Automated backups + WAL archiving / PITR**, with at least one **tested restore**.
- **Observability** — `pg_stat_statements` + slow-query logging
  (`log_min_duration_statement`) + basic metrics/alerts.

**Later (hardening / scale / audit-readiness):**

- Customer-managed KMS keys; IAM-based DB auth; network isolation (private subnet).
- Multi-AZ synchronous standby + read replicas; documented RTO/RPO + failover runbook.
- **Expand-contract** (parallel-change) as the standard for breaking schema changes.
- **`pgaudit`** with logs shipped to a SIEM; full observability dashboards.
- PII inventory, GDPR right-to-erasure workflow, retention automation, data-residency.

## Consequences

- We **commit to the SQL/Postgres paradigm deliberately** — there is **no** bespoke
  "database-agnostic" abstraction layer, by design (Q2). Revisit only on a concrete,
  justified requirement.
- **`packages/db` is the single, one-way data-access choke-point** — testable, and
  drop-in replaceable for same-paradigm changes; blast-radius-contained otherwise.
- Drizzle is low-lock-in but its DSL is Drizzle-specific; dropping it later means
  rewriting queries — SQL knowledge transfers, and Kysely is a graceful downgrade.
- The scaling roadmap and enterprise checklist are **adopted incrementally** — day-1
  items land with the first schema; scale/hardening items are tracked, not front-loaded.
- If Neon is adopted for dev, **avoid its proprietary serverless driver** and document
  any Neon-specific extensions.

## Revisit triggers (when to reopen this decision)

- A **concrete, justified** workload that genuinely fits a document/graph/columnar
  store — evaluate that service on its merits (polyglot); do **not** convert wholesale.
- **Drizzle** is abandoned or regresses materially → fall back to **Kysely**.
- A **single Postgres primary** is genuinely outgrown → replicas → partitioning →
  sharding, **before** any paradigm change.
- A **compliance / data-residency** requirement dictates a specific managed provider →
  revisit self-host-vs-managed (the code doesn't change — it's still Postgres).

## Sources

**Why relational vs NoSQL**

- Martin Fowler — Polyglot Persistence — <https://martinfowler.com/bliki/PolyglotPersistence.html>
- Sadalage & Fowler, _NoSQL Distilled_ (aggregate model, CAP, polyglot) — <https://martinfowler.com/books/nosql.html>
- AWS — SQL vs NoSQL / relational vs non-relational — <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SQLtoNoSQL.WhyDynamoDB.html>, <https://aws.amazon.com/compare/the-difference-between-relational-and-non-relational-databases/>
- PostgreSQL JSONB — <https://www.postgresql.org/docs/current/datatype-json.html>
- Azure — data-store decision tree — <https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/data-store-decision-tree>
- CAP / PACELC — <https://www.scylladb.com/glossary/cap-theorem/>, <https://www.scylladb.com/glossary/pacelc-theorem/>

**Q1 — ORM vs raw SQL / scale**

- DEPT "Prisma vs Kysely" benchmark — <https://engineering.deptagency.com/prisma-vs-kysely>
- Encore "TypeScript ORMs" — <https://encore.dev/articles/typescript-orms>
- Prisma TypedSQL — <https://www.prisma.io/typedsql>, <https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql>
- Kysely — <https://kysely.dev/docs/intro>, <https://github.com/kysely-org/kysely>
- jOOQ (data-mapper middle ground) — <https://cantina.co/jooq-a-happy-medium-between-orms-and-jdbc/>
- ORM vs SQL — <https://www.techtarget.com/searchsoftwarequality/tip/ORM-vs-SQL-When-to-use-each>
- N+1 problem — <https://dev.to/lovestaco/the-n1-query-problem-the-silent-performance-killer-2b1c>, <https://readyset.io/blog/investigating-and-optimizing-over-querying>

**Q2 — portability, lock-in & persistence patterns**

- EnterpriseDB, "vendor lock-in is not binary" — <https://www.enterprisedb.com/postgres-tutorials/why-vendor-lock-not-binary-decission>
- Repository pattern — <https://blog.elmah.io/the-repository-pattern-is-simple-yet-misunderstood/>, <https://medium.com/@iamprovidence/is-repository-an-anti-pattern-6aba7422fa48>
- Microsoft DDD persistence layer — <https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design>
- Hexagonal architecture — <https://alistair.cockburn.us/hexagonal-architecture>, <https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>
- Postgres ↔ Mongo migration reality — <https://www.mongodb.com/resources/compare/mongodb-postgresql/dsl-migrating-postgres-to-mongodb>
- Cloud NoSQL lock-in — <https://www.pulumi.com/blog/when-to-use-azure-cosmos-db/>, <https://www.pcstacks.com/database-platforms-that-help-avoid-vendor-lock-in/>
- Leaky abstractions — <https://en.wikipedia.org/wiki/Leaky_abstraction>, <https://khalilstemmler.com/wiki/leaky-abstraction/>

**Q3 — libraries, Better Auth adapters & Neon**

- Better Auth — database & adapters — <https://www.better-auth.com/docs/concepts/database>, <https://www.better-auth.com/docs/adapters/other-relational-databases>, <https://www.better-auth.com/docs/adapters/drizzle>, <https://www.better-auth.com/docs/adapters/mongo>
- Drizzle — <https://orm.drizzle.team/docs/overview>
- Kysely — <https://kysely.dev/docs/intro>
- Prisma — <https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma>, <https://www.prisma.io/blog/rust-free-prisma-orm-is-ready-for-production>
- Neon — <https://neon.com/docs/introduction>, <https://neon.com/docs/import/migrate-from-postgres>, <https://neon.com/docs/manage/backup-pg-dump>

**Scaling to millions**

- PostgreSQL — declarative partitioning — <https://www.postgresql.org/docs/current/ddl-partitioning.html>
- PostgreSQL — performance tips / `EXPLAIN` — <https://www.postgresql.org/docs/current/performance-tips.html>
- OpenAI — scaling PostgreSQL — <https://openai.com/index/scaling-postgresql/> (+ analysis <https://www.rajkumarsamra.me/blog/scaling-postgresql-to-millions-of-queries-per-second>)
- Drizzle — read replicas (`withReplicas`) — <https://orm.drizzle.team/docs/read-replicas>
- PgBouncer scaling — <https://www.percona.com/blog/scaling-postgresql-with-pgbouncer-you-may-need-a-connection-pooler-sooner-than-you-expect/>, <https://planetscale.com/blog/scaling-postgres-connections-with-pgbouncer>
- Better Auth — secondary storage / rate limit — <https://better-auth.com/docs/concepts/rate-limit>
- Citus — <https://www.citusdata.com/product/community>
- AWS — Aurora replication / RDS read replicas — <https://aws.amazon.com/rds/features/read-replicas/>

**Enterprise standards & best practices**

- PostgreSQL — Row Security Policies — <https://www.postgresql.org/docs/current/ddl-rowsecurity.html>
- PostgreSQL — Continuous Archiving & PITR — <https://www.postgresql.org/docs/current/continuous-archiving.html>
- PostgreSQL — SSL/TLS — <https://www.postgresql.org/docs/current/ssl-tcp.html>, <https://www.postgresql.org/docs/current/libpq-ssl.html>
- OWASP — Database Security Cheat Sheet — <https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html>
- AWS — Aurora/RDS PostgreSQL Security Whitepaper — <https://d1.awsstatic.com/Amazon%20Aurora%20PostgreSQL%20and%20Amazon%20RDS%20for%20PostgreSQL%20Security%20Whitepaper.pdf>
- AWS — multi-tenant isolation with RLS — <https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security>
- Azure — encryption at rest — <https://learn.microsoft.com/en-us/azure/postgresql/security/security-data-encryption>
- pgAudit — <https://www.pgaudit.org/>, <https://cloud.google.com/sql/docs/postgres/pg-audit>
- Expand-contract migrations — <https://xata.io/blog/pgroll-expand-contract>

**Query organization (per-aggregate modules)**

- Drizzle ORM best practices (patterns & structure) — <https://paulserban.eu/blog/post/drizzle-orm-best-practices-principles-patterns-and-real-world-case-studies/>
- Data-access-pattern-first with Drizzle — <https://medium.com/drizzle-stories/the-data-access-pattern-first-approach-with-drizzle-bca035bbdc63>
- Repository pattern with Drizzle — <https://medium.com/@vimulatus/repository-pattern-in-nest-js-with-drizzle-orm-e848aa75ecae>
- Migrations belong in version control — <https://orm.drizzle.team/docs/migrations>

See [0016](0016-authentication-strategy.md) (auth strategy), [../references.md](../references.md), and [../future-improvements.md](../future-improvements.md).
