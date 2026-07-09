export type InsightTone = "positive" | "neutral" | "attention";

export interface Insight {
  title: string;
  detail: string;
  tone: InsightTone;
}

export interface KpiItem {
  label: string;
  value: string;
}

export interface ReportSummary {
  file_id: string;
  file_name: string;
  row_count: number;
  column_count: number;
  kpis: KpiItem[];
  insights: Insight[];
}

export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportType = "PDF" | "EXCEL" | "CSV";

export interface ReportRecord {
  id: string;
  title: string;
  type: ReportType;
  createdAt: string;
  uploadedFile: { originalName: string } | null;
}
