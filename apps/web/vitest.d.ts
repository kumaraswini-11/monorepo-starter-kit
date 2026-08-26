// Makes the @testing-library/jest-dom matcher types visible to `tsc` for this app's
// component tests; the matchers are registered at runtime by the shared `dom` preset's
// setup file (ADR 0025).
import "@testing-library/jest-dom/vitest";
