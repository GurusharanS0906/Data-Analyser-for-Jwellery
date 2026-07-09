"use client";

import * as React from "react";
import { toast } from "sonner";
import { BarChart3, Loader2, UploadCloud } from "lucide-react";

import { FileSelector } from "@/components/dashboard/file-selector";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { fetchAutoAnalytics } from "@/lib/analytics-client";
import type { UploadedFileSummary } from "@/types/chat";
import type { ChartSpec } from "@/types/chart";

export function AnalyticsPanel() {
  const [files, setFiles] = React.useState<UploadedFileSummary[]>([]);
  const [selectedFileId, setSelectedFileId] = React.useState("");
  const [charts, setCharts] = React.useState<ChartSpec[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = React.useState(false);

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
    const backendFileId = files.find((f) => f.id === selectedFileId)?.fileName;
    if (!backendFileId) return;

    let cancelled = false;
    async function loadCharts() {
      setIsLoadingCharts(true);
      try {
        const data = await fetchAutoAnalytics(backendFileId!);
        if (!cancelled) setCharts(data.charts);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load analytics.");
          setCharts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingCharts(false);
      }
    }
    loadCharts();
    return () => {
      cancelled = true;
    };
  }, [selectedFileId, files]);

  if (!isLoadingFiles && files.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState
          icon={UploadCloud}
          title="Upload a file to see analytics"
          description="Charts are generated automatically from your uploaded customer data."
          action={{ label: "Upload File", href: "/dashboard/upload" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FileSelector
        files={files}
        selectedFileId={selectedFileId}
        onChange={setSelectedFileId}
        placeholder="Select a file to analyze"
        disabled={isLoadingFiles}
      />

      {isLoadingCharts ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : charts.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to chart yet"
          description="This file doesn't have enough categorical or numeric structure to auto-generate charts — try AI Chat to ask a specific question instead."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {charts.map((chart, i) => (
            <ChartRenderer key={`${chart.title}-${i}`} spec={chart} />
          ))}
        </div>
      )}
    </div>
  );
}
