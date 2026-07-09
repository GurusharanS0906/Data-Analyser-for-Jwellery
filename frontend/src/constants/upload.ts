export const ALLOWED_UPLOAD_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;
export const MAX_UPLOAD_SIZE_MB = 100;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function isAllowedUploadFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
