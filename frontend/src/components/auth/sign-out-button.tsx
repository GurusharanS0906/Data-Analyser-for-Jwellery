"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("rounded-full", className)}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="size-4" />
      Log Out
    </Button>
  );
}
