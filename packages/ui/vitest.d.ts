// Makes the @testing-library/jest-dom matcher types (toBeInTheDocument, toHaveTextContent,
// toBeDisabled, …) visible to `tsc` for this package's component tests. The matchers
// themselves are registered at runtime by the shared `dom` preset's setup file (ADR 0029).
import "@testing-library/jest-dom/vitest";
