import { formatNumber } from "@/lib/format";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number; color: string }[];
}

export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
