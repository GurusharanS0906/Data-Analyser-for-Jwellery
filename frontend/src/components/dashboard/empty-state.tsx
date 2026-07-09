import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button asChild size="sm" variant="outline" className="mt-1 rounded-full">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
