// Node preset (ADR 0029): packages/email is server-side; the adapter tests mock the transport,
// so no DOM/jsdom is needed. `server-only` is aliased to a noop by the shared base preset.
export { base as default } from "@workspace/vitest-config";
