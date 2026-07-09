"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  isAllowedUploadFile,
} from "@/constants/upload";
import {
  confirmUpload,
  requestCleanPreview,
  uploadFileWithProgress,
} from "@/lib/upload-client";
import { Dropzone } from "@/components/dashboard/upload/dropzone";
import { UploadProgressCard } from "@/components/dashboard/upload/upload-progress-card";
import { PreviewTable } from "@/components/dashboard/upload/preview-table";
import { CleaningIssuesSummary } from "@/components/dashboard/upload/cleaning-issues-summary";
import { CleaningResultSummary } from "@/components/dashboard/upload/cleaning-result-summary";
import type {
  CleanResponse,
  UploadAnalyzeResponse,
} from "@/types/upload";

type Step =
  | "idle"
  | "uploading"
  | "analyzed"
  | "cleaning"
  | "cleaned"
  | "confirming"
  | "done"
  | "error";

export function UploadFlow() {
  const router = useRouter();
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const [step, setStep] = React.useState<Step>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [analyzeResult, setAnalyzeResult] = React.useState<UploadAnalyzeResponse | null>(
    null
  );
  const [cleanResult, setCleanResult] = React.useState<CleanResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");

  function reset() {
    setStep("idle");
    setFile(null);
    setProgress(0);
    setAnalyzeResult(null);
    setCleanResult(null);
    setErrorMessage("");
  }

  async function startUpload(selected: File) {
    setFile(selected);
    setStep("uploading");
    setProgress(0);

    try {
      const result = await uploadFileWithProgress(selected, setProgress);
      setAnalyzeResult(result);
      setStep("analyzed");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
      setStep("error");
    }
  }

  async function handleClean() {
    if (!analyzeResult) return;
    setStep("cleaning");
    try {
      const result = await requestCleanPreview(analyzeResult.file_id);
      setCleanResult(result);
      setStep("cleaned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clean the data.");
      setStep("analyzed");
    }
  }

  async function handleSave(applyCleaning: boolean) {
    if (!analyzeResult || !file) return;
    setStep("confirming");

    try {
      const result = await confirmUpload(analyzeResult.file_id, applyCleaning);

      const persistResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: analyzeResult.file_id,
          originalName: analyzeResult.original_name,
          fileType: file.name.split(".").pop() ?? "unknown",
          fileSizeKb: analyzeResult.file_size_kb,
          storagePath: result.duckdb_path,
          rowCount: result.row_count,
          columnCount: result.column_count,
          cleaningLog: applyCleaning ? cleanResult?.summary : undefined,
        }),
      });

      if (!persistResponse.ok) {
        const body = await persistResponse.json().catch(() => null);
        throw new Error(body?.error ?? "Could not save the upload record.");
      }

      setStep("done");
      router.refresh();
      toast.success("Upload saved!", {
        description: `${result.row_count.toLocaleString()} rows are ready for analysis.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the upload.");
      setStep(cleanResult ? "cleaned" : "analyzed");
    }
  }

  const isBusy = step === "uploading" || step === "cleaning" || step === "confirming";

  return (
    <div className="space-y-5">
      <input
        ref={replaceInputRef}
        type="file"
        accept={ALLOWED_UPLOAD_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          e.target.value = "";
          if (!selected) return;
          if (!isAllowedUploadFile(selected.name)) {
            toast.error("Unsupported file type", {
              description: `Please upload ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}`,
            });
            return;
          }
          if (selected.size > MAX_UPLOAD_SIZE_BYTES) {
            toast.error("File too large", {
              description: `Maximum upload size is ${MAX_UPLOAD_SIZE_MB}MB`,
            });
            return;
          }
          startUpload(selected);
        }}
      />

      {step === "idle" && <Dropzone onFileSelected={startUpload} />}

      {step === "error" && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={reset}
          >
            <RefreshCw className="size-3.5" />
            Try Again
          </Button>
        </Card>
      )}

      {file && step !== "idle" && step !== "error" && step !== "done" && (
        <>
          {step === "uploading" ? (
            <UploadProgressCard
              file={file}
              percent={progress}
              statusLabel={progress < 100 ? "Uploading..." : "Analyzing your data..."}
            />
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="size-4 text-foreground" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {analyzeResult?.row_count.toLocaleString()} rows ·{" "}
                  {analyzeResult?.column_count} columns
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => replaceInputRef.current?.click()}
                  className="text-xs text-muted-foreground"
                >
                  <RefreshCw className="size-3.5" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={reset}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {(step === "analyzed" || step === "cleaning") && analyzeResult && (
            <>
              <PreviewTable
                columns={analyzeResult.columns}
                rows={analyzeResult.rows}
                rowCount={analyzeResult.row_count}
              />
              <CleaningIssuesSummary
                issues={analyzeResult.issues}
                hasIssues={analyzeResult.has_issues}
                onClean={handleClean}
                onSkip={() => handleSave(false)}
                isProcessing={step === "cleaning"}
              />
              {!analyzeResult.has_issues && (
                <Button
                  onClick={() => handleSave(false)}
                  className="rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
                >
                  <Save className="size-4" />
                  Save to Dashboard
                </Button>
              )}
            </>
          )}

          {(step === "cleaned" || step === "confirming") && cleanResult && (
            <>
              <PreviewTable
                columns={cleanResult.columns}
                rows={cleanResult.rows}
                rowCount={cleanResult.row_count}
              />
              <CleaningResultSummary summary={cleanResult.summary} />
              <Button
                disabled={step === "confirming"}
                onClick={() => handleSave(true)}
                className="rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
              >
                {step === "confirming" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Cleaned Data
              </Button>
            </>
          )}
        </>
      )}

      {step === "done" && (
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="mt-4 text-base font-semibold">
            {file?.name} is saved and ready
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            It now appears in your Recent Uploads on the dashboard.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={reset}
          >
            Upload Another File
          </Button>
        </Card>
      )}
    </div>
  );
}
