// Registers @testing-library/jest-dom matchers (toBeInTheDocument, toHaveAccessibleName,
// toHaveAttribute, …) on Vitest's `expect`. Wired via the `dom` preset's `setupFiles`.
import "@testing-library/jest-dom/vitest";
