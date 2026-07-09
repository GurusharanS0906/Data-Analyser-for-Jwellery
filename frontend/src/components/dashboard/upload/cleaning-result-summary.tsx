import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CleaningSummary } from "@/types/upload";

export function CleaningResultSummary({ summary }: { summary: CleaningSummary }) {
  const items: string[] = [];

  if (summary.empty_rows_removed > 0) {
    items.push(
      `Removed ${summary.empty_rows_removed.toLocaleString()} completely empty row${summary.empty_rows_removed === 1 ? "" : "s"}`
    );
  }
  if (summary.duplicate_rows_removed > 0) {
    items.push(
      `Removed ${summary.duplicate_rows_removed.toLocaleString()} duplicate row${summary.duplicate_rows_removed === 1 ? "" : "s"}`
    );
  }
  if (summary.date_columns_normalized.length > 0) {
    items.push(`Normalized date format in: ${summary.date_columns_normalized.join(", ")}`);
  }
  if (summary.currency_columns_normalized.length > 0) {
    items.push(
      `Converted currency text to numbers in: ${summary.currency_columns_normalized.join(", ")}`
    );
  }

  const remainingMissing = Object.entries(summary.remaining_missing_values);
  const totalRemaining = remainingMissing.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <CheckCircle2 className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Cleaning complete</p>
          {items.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Nothing needed changing.</p>
          )}
          {totalRemaining > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {totalRemaining.toLocaleString()} missing value
              {totalRemaining === 1 ? "" : "s"} remain in{" "}
              {remainingMissing.map(([col]) => col).join(", ")} — left as-is since we
              can&apos;t guess the right value for you.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
