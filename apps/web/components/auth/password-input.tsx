"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/shadcn/input-group";

/**
 * Password field with an accessible show/hide toggle, built on shadcn's `input-group`
 * (the purpose-built input-with-addon primitive) instead of hand-positioning a button —
 * so the border, focus-visible ring, and `aria-invalid` state are handled by the group.
 * The toggle is a real `<button>` with `aria-pressed` + `aria-label`, and `tabIndex={-1}`
 * so it doesn't interrupt the tab flow between the field and submit.
 */
export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof InputGroupInput>) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        type={visible ? "text" : "password"}
        className={className}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
