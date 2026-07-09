import { z } from "zod";

export const confirmUploadApiSchema = z.object({
  fileId: z.string().min(1),
  originalName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(10),
  fileSizeKb: z.number().int().positive(),
  storagePath: z.string().min(1),
  rowCount: z.number().int().nonnegative(),
  columnCount: z.number().int().nonnegative(),
  cleaningLog: z.record(z.string(), z.unknown()).optional(),
});

export type ConfirmUploadApiValues = z.infer<typeof confirmUploadApiSchema>;
