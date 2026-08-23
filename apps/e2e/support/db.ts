/**
 * The e2e Postgres connection string default — the docker-compose `app` DB locally, a Postgres
 * service in CI. Both are loopback + disposable (global-setup wipes the schema each run). This is
 * only the default: an explicit `process.env.DATABASE_URL` still wins. Global-setup and the
 * Playwright `webServer` both resolve through it, so they can never disagree on which DB to use.
 * (ADR 0029)
 */
export const DEFAULT_DATABASE_URL =
  "postgres://postgres:postgres@127.0.0.1:5432/app";
