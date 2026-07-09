"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSelector } from "@/components/dashboard/file-selector";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InsightCard } from "@/components/dashboard/reports/insight-card";
import { RecentReports } from "@/components/dashboard/reports/recent-reports";
import { fetchReportSummary, downloadReport } from "@/lib/reports-client";
import type { ReportFormat, ReportSummary } from "@/types/report";
import type { UploadedFileSummary } from "@/types/chat";

const FORMAT_TO_TYPE = { pdf: "PDF", excel: "EXCEL", csv: "CSV" } as const;

export function ReportsPanel() {
  const [files, setFiles] = React.useState<UploadedFileSummary[]>([]);
  const [selectedFileId, setSelectedFileId] = React.useState("");
  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [downloading, setDownloading] = React.useState<ReportFormat | null>(null);
  const [reloadReportsKey, setReloadReportsKey] = React.useState(0);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  React.useEffect(() => {
    async function loadFiles() {
      setIsLoadingFiles(true);
      try {
        const res = await fetch("/api/uploads");
        const data = await res.json();
        setFiles(data.uploadedFiles ?? []);
        if (data.uploadedFiles?.length > 0) {
          setSelectedFileId(data.uploadedFiles[0].id);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    }
    loadFiles();
  }, []);

  React.useEffect(() => {
    if (!selectedFile) return;
    let cancelled = false;
    async function loadSummary() {
      setIsLoadingSummary(true);
      try {
        const data = await fetchReportSummary(
          selectedFile!.fileName,
          selectedFile!.originalName
        );
        if (!cancelled) setSummary(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load insights.");
          setSummary(null);
        }
      } finally {
        if (!cancelled) setIsLoadingSummary(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [selectedFile]);

  async function handleDownload(format: ReportFormat) {
    if (!selectedFile) return;
    setDownloading(format);
    try {
      await downloadReport(selectedFile.fileName, selectedFile.originalName, format);
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadedFileId: selectedFile.id,
          title: `${selectedFile.originalName} — ${FORMAT_TO_TYPE[format]}`,
          type: FORMAT_TO_TYPE[format],
        }),
      });
      setReloadReportsKey((k) => k + 1);
      toast.success(`${FORMAT_TO_TYPE[format]} report downloaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  if (!isLoadingFiles && files.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState
          icon={UploadCloud}
          title="Upload a file to generate reports"
          description="Reports and insights are built from your uploaded customer data."
          action={{ label: "Upload File", href: "/dashboard/upload" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FileSelector
          files={files}
          selectedFileId={selectedFileId}
          onChange={setSelectedFileId}
          placeholder="Select a file to report on"
          disabled={isLoadingFiles}
        />

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!summary || downloading !== null}
            onClick={() => handleDownload("pdf")}
          >
            {downloading === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!summary || downloading !== null}
            onClick={() => handleDownload("excel")}
          >
            {downloading === "excel" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!summary || downloading !== null}
            onClick={() => handleDownload("csv")}
          >
            {downloading === "csv" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!summary}
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      {isLoadingSummary ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : summary ? (
        <div id="report-printable" className="space-y-6">
          <div className="hidden print:block">
            <h1 className="font-heading text-2xl font-semibold">
              Jewellery AI Analytics — Business Report
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.file_name} · {summary.row_count.toLocaleString()} records
            </p>
          </div>

          {summary.kpis.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {summary.kpis.map((kpi) => (
                <Card key={kpi.label} className="rounded-2xl border-border/80 p-5">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 font-heading text-2xl font-semibold">{kpi.value}</p>
                </Card>
              ))}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-foreground" />
              <h2 className="font-heading text-base font-semibold">Smart Insights</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {summary.insights.map((insight, i) => (
                <InsightCard key={`${insight.title}-${i}`} insight={insight} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="print:hidden">
        <RecentReports reloadKey={reloadReportsKey} />
      </div>
    </div>
  );
}
