"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SignOutButton } from "@/components/auth/sign-out-button";

function initialsFor(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function NavbarAuthActions({ layout = "row" }: { layout?: "row" | "column" }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="h-9 w-24 rounded-full" />;
  }

  if (session?.user) {
    return (
      <div
        className={
          layout === "row"
            ? "flex items-center gap-3"
            : "flex flex-col gap-3"
        }
      >
        <Button variant="ghost" asChild className="rounded-full">
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>
        <SignOutButton />
        <Avatar className="size-8 border border-foreground/15">
          <AvatarImage
            src={session.user.image ?? undefined}
            alt={session.user.name ?? "User"}
          />
          <AvatarFallback className="bg-foreground/5 text-xs font-semibold text-foreground">
            {initialsFor(session.user.name, session.user.email)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className={layout === "row" ? "flex items-center gap-3" : "flex flex-col gap-3"}>
      <Button variant={layout === "row" ? "ghost" : "outline"} asChild>
        <Link href="/login">Log In</Link>
      </Button>
      <Button
        asChild
        className="rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
      >
        <Link href="/signup">Start Free Trial</Link>
      </Button>
    </div>
  );
}
