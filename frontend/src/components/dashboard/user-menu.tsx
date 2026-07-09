"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="size-9 rounded-full" />;
  }

  const user = session?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-foreground/20 transition-shadow focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="size-9 border border-foreground/15">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback className="bg-foreground/5 text-xs font-semibold text-foreground">
              {initialsFor(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user?.name ?? "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
