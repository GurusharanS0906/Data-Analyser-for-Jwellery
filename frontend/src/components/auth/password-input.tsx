"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function PasswordInput(props, ref) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className="pr-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
});
