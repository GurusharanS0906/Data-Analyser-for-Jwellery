"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/google-icon";

export function GoogleButton({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isLoading}
      className="h-11 w-full rounded-full border-border"
      onClick={() => {
        setIsLoading(true);
        signIn("google", { callbackUrl }).catch(() => setIsLoading(false));
      }}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleIcon className="size-4" />
      )}
      Continue with Google
    </Button>
  );
}
