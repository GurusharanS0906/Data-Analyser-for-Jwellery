import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight } from "@/types/report";

const TONE_CONFIG = {
  positive: {
    icon: TrendingUp,
    wrap: "border-emerald-500/25 bg-emerald-500/5",
    chip: "bg-emerald-500/15 text-emerald-500",
  },
  attention: {
    icon: AlertTriangle,
    wrap: "border-foreground/15 bg-foreground/[0.03]",
    chip: "bg-foreground/[0.08] text-foreground",
  },
  neutral: {
    icon: Lightbulb,
    wrap: "border-border/80",
    chip: "bg-muted text-muted-foreground",
  },
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const config = TONE_CONFIG[insight.tone];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", config.wrap)}>
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", config.chip)}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
      </div>
    </div>
  );
}
