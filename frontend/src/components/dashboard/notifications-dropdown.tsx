"use client";

import { Bell, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function NotificationsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full">
          <Bell className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" />
          </div>
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="text-xs text-muted-foreground">
            Upload activity and insights will show up here.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
