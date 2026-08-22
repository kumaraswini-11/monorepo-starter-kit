// Empty module. The `dom`/`base` presets alias `server-only` and `client-only` here so
// those build-time environment guards (which throw outside their target environment) become
// no-ops under test. (ADR 0029)
export {};
