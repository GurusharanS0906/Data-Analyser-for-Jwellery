import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <Card className={cn("rounded-2xl border-border/80 p-4", className)}>
      <p className="mb-3 px-1 text-sm font-medium text-foreground/90">{title}</p>
      {children}
    </Card>
  );
}
