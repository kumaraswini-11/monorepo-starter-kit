# @workspace/env

Validated, typed environment (12-factor fail-fast) via `@t3-oss/env-core` + zod. Consumers
import `env` instead of reading `process.env` directly (lint-enforced choke-point).

## Entry point

`@workspace/env` → `env` (validated vars) + `appUrl`. Framework-agnostic (runs unchanged in Next
or a standalone Node backend). `SKIP_ENV_VALIDATION=1` keeps a secret-less CI build green; real
runtimes fail fast on missing/malformed config. See ADR
[0013](../../docs/decisions/0013-env-and-secrets-management.md).
