import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CleaningIssues } from "@/types/upload";

interface CleaningIssuesSummaryProps {
  issues: CleaningIssues;
  hasIssues: boolean;
  onClean: () => void;
  onSkip: () => void;
  isProcessing?: boolean;
}

export function CleaningIssuesSummary({
  issues,
  hasIssues,
  onClean,
  onSkip,
  isProcessing,
}: CleaningIssuesSummaryProps) {
  if (!hasIssues) {
    return (
      <Card className="rounded-2xl border-border/80 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">No data quality issues found</p>
            <p className="text-xs text-muted-foreground">
              Your file looks clean — ready to save.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const missingColumns = Object.entries(issues.missing_values);
  const totalMissing = missingColumns.reduce((sum, [, count]) => sum + count, 0);

  const items: string[] = [];
  if (totalMissing > 0) {
    items.push(
      `${totalMissing.toLocaleString()} missing value${totalMissing === 1 ? "" : "s"} across ${missingColumns.length} column${missingColumns.length === 1 ? "" : "s"} (${missingColumns.map(([col]) => col).join(", ")})`
    );
  }
  if (issues.duplicate_rows > 0) {
    items.push(
      `${issues.duplicate_rows.toLocaleString()} duplicate row${issues.duplicate_rows === 1 ? "" : "s"}`
    );
  }
  if (issues.empty_rows > 0) {
    items.push(
      `${issues.empty_rows.toLocaleString()} completely empty row${issues.empty_rows === 1 ? "" : "s"}`
    );
  }
  if (issues.inconsistent_date_columns.length > 0) {
    items.push(
      `Inconsistent date format in: ${issues.inconsistent_date_columns.join(", ")}`
    );
  }
  if (issues.inconsistent_currency_columns.length > 0) {
    items.push(
      `Inconsistent currency format in: ${issues.inconsistent_currency_columns.join(", ")}`
    );
  }

  return (
    <Card className="rounded-2xl border-foreground/15 bg-foreground/[0.03] p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08] text-foreground">
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            We found a few things worth cleaning up
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={isProcessing}
              onClick={onClean}
              className="rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Clean My Data
            </Button>
            <Button
              type="button"
              disabled={isProcessing}
              variant="outline"
              onClick={onSkip}
              className="rounded-full"
            >
              Skip &amp; Use As-Is
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
