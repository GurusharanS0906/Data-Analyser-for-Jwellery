import { FileSpreadsheet, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadProgressCardProps {
  file: File;
  percent: number;
  statusLabel: string;
  onCancel?: () => void;
}

export function UploadProgressCard({
  file,
  percent,
  statusLabel,
  onCancel,
}: UploadProgressCardProps) {
  return (
    <Card className="rounded-2xl border-border/80 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
          <FileSpreadsheet className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{file.name}</p>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={onCancel}
                aria-label="Cancel"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={percent} className="h-2 flex-1" />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {percent}%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{statusLabel}</p>
        </div>
      </div>
    </Card>
  );
}
