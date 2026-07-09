import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  isEmpty?: boolean;
}

export function StatCard({ icon: Icon, label, value, hint, isEmpty }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border/80 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-2 font-heading text-2xl font-semibold",
              isEmpty && "text-muted-foreground/50"
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}
