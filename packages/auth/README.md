# @workspace/auth

Framework-neutral **Better Auth** server instance, browser client, and auth building blocks —
the single source of auth truth for any consumer (the Next app today; a standalone backend later).

## Entry points

| Import                      | What                                                                      |
| --------------------------- | ------------------------------------------------------------------------- |
| `@workspace/auth`           | the configured server `auth` instance + inferred `Session` / `User` types |
| `@workspace/auth/auth`      | the `auth` instance (server-only)                                         |
| `@workspace/auth/client`    | the browser `authClient` (`signIn` / `signUp` / `signOut` / `useSession`) |
| `@workspace/auth/device`    | user-agent / location helpers for security emails                         |
| `@workspace/auth/plugins/*` | Better Auth plugins (e.g. `account-exists`)                               |

Server modules are guarded with `server-only`; the client entry ships no server code. See ADRs
[0011](../../docs/decisions/0011-authentication-strategy.md) (strategy),
[0017](../../docs/decisions/0017-backend-architecture-and-migration.md) (wiring + split),
[0018](../../docs/decisions/0018-rate-limiting-and-secondary-storage.md) (rate limiting).
