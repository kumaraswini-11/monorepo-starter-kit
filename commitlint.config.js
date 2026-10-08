/**
 * Conventional Commits (ADR 0037). Enforced locally by the `commit-msg` hook and, for the
 * squash-merge title, by the PR-title workflow — hooks are bypassable, CI is not.
 */
export default {
  extends: ["@commitlint/config-conventional"],
};
