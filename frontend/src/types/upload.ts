export type ColumnDataType = "number" | "text" | "date" | "currency";

export interface ColumnPreview {
  name: string;
  dtype: ColumnDataType;
}

export interface CleaningIssues {
  missing_values: Record<string, number>;
  duplicate_rows: number;
  empty_rows: number;
  inconsistent_date_columns: string[];
  inconsistent_currency_columns: string[];
}

export interface UploadAnalyzeResponse {
  file_id: string;
  original_name: string;
  file_size_kb: number;
  row_count: number;
  column_count: number;
  columns: ColumnPreview[];
  rows: Record<string, unknown>[];
  issues: CleaningIssues;
  has_issues: boolean;
}

export interface CleaningSummary {
  empty_rows_removed: number;
  duplicate_rows_removed: number;
  date_columns_normalized: string[];
  currency_columns_normalized: string[];
  remaining_missing_values: Record<string, number>;
}

export interface CleanResponse {
  file_id: string;
  row_count: number;
  column_count: number;
  columns: ColumnPreview[];
  rows: Record<string, unknown>[];
  summary: CleaningSummary;
}

export interface ConfirmUploadResponse {
  file_id: string;
  storage_path: string;
  duckdb_path: string;
  row_count: number;
  column_count: number;
}
