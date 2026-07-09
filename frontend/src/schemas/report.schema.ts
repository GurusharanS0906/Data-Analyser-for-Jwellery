import { z } from "zod";

export const recordReportSchema = z.object({
  uploadedFileId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  type: z.enum(["PDF", "EXCEL", "CSV"]),
});

export type RecordReportValues = z.infer<typeof recordReportSchema>;
