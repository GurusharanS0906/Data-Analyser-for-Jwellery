import Link from "next/link";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-heading text-lg font-semibold tracking-tight",
        className
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-foreground/20 bg-foreground/5">
        <Gem className="size-4 text-foreground" strokeWidth={1.75} />
      </span>
      <span>
        Jewellery<span className="text-muted-foreground">AI</span>
      </span>
    </Link>
  );
}
