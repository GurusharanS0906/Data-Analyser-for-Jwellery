import type { ReportFormat, ReportSummary } from "@/types/report";

async function getBackendToken(): Promise<{ token: string; apiUrl: string }> {
  const response = await fetch("/api/uploads/token");
  if (!response.ok) {
    throw new Error("Could not load reports. Please log in again.");
  }
  return response.json();
}

export async function fetchReportSummary(
  fileId: string,
  fileName: string
): Promise<ReportSummary> {
  const { token, apiUrl } = await getBackendToken();
  const url = `${apiUrl}/api/v1/reports/${fileId}/summary?file_name=${encodeURIComponent(fileName)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Could not load report insights.");
  }
  return response.json();
}

const EXTENSIONS: Record<ReportFormat, string> = {
  pdf: "pdf",
  excel: "xlsx",
  csv: "csv",
};

/** Downloads the generated report as a blob and triggers a browser save. */
export async function downloadReport(
  fileId: string,
  fileName: string,
  format: ReportFormat
): Promise<void> {
  const { token, apiUrl } = await getBackendToken();
  const url =
    `${apiUrl}/api/v1/reports/${fileId}/download` +
    `?format=${format}&file_name=${encodeURIComponent(fileName)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Could not generate the report.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const baseName = fileName.replace(/\.[^.]+$/, "") || "report";

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${baseName}.${EXTENSIONS[format]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
