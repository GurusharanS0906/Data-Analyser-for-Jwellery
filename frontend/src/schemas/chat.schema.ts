import { z } from "zod";

export const createChatSessionSchema = z.object({
  uploadedFileId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(200).optional(),
});

export type CreateChatSessionValues = z.infer<typeof createChatSessionSchema>;

export const createChatMessageSchema = z.object({
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().min(1),
  chartConfig: z.record(z.string(), z.unknown()).optional(),
});

export type CreateChatMessageValues = z.infer<typeof createChatMessageSchema>;
