"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopbarSearch() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            disabled
            placeholder="Search uploads, questions..."
            className="rounded-full bg-secondary/60 pl-9"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Search unlocks once you&apos;ve uploaded your first file
      </TooltipContent>
    </Tooltip>
  );
}
