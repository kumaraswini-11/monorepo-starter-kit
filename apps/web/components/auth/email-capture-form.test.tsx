import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormSubmitError } from "@workspace/ui/components/form/form-submit";

import { EmailCaptureForm } from "./email-capture-form";

describe("EmailCaptureForm", () => {
  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<EmailCaptureForm />);

    await user.type(screen.getByLabelText("Email"), "notanemail");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByText("Enter a valid email address")
    ).toBeInTheDocument();
  });

  it("calls onSubmit with the entered email when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EmailCaptureForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "you@company.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledWith("you@company.com");
  });

  it("surfaces a thrown FormSubmitError in the error banner (ADR 0026)", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        onSubmit={() => {
          throw new FormSubmitError("Something went wrong.");
        }}
      />
    );

    await user.type(screen.getByLabelText("Email"), "you@company.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong."
    );
  });
});
