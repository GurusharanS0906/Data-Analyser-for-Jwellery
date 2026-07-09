"use client";

import * as React from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import type { ReportRecord, ReportType } from "@/types/report";

const TYPE_ICON: Record<ReportType, typeof FileText> = {
  PDF: FileText,
  EXCEL: FileSpreadsheet,
  CSV: FileDown,
};

export function RecentReports({ reloadKey }: { reloadKey: number }) {
  const [reports, setReports] = React.useState<ReportRecord[]>([]);

  React.useEffect(() => {
    async function load() {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
      }
    }
    load();
  }, [reloadKey]);

  if (reports.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/80 p-5">
      <h2 className="mb-4 font-heading text-base font-semibold">Recent Reports</h2>
      <ul className="space-y-2">
        {reports.map((report) => {
          const Icon = TYPE_ICON[report.type];
          return (
            <li
              key={report.id}
              className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-foreground" />
                <span className="truncate">{report.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {report.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(report.createdAt))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
