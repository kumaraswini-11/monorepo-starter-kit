import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrength } from "@workspace/ui/components/form/password-strength";

describe("PasswordStrength", () => {
  it("renders no rating for an empty password", () => {
    render(<PasswordStrength password="" />);
    expect(screen.queryByText("Weak")).not.toBeInTheDocument();
    expect(screen.queryByText("Strong")).not.toBeInTheDocument();
  });

  it("rates a short password Weak", () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("rates a long, varied password Strong", () => {
    render(<PasswordStrength password="Abcdefghij1!xyz" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("exposes the rating to assistive tech via a live region", () => {
    render(<PasswordStrength password="Abcdefghij1!xyz" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password strength: Strong"
    );
  });
});
