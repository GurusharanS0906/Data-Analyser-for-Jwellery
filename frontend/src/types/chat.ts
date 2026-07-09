import type { ChartSpec } from "@/types/chart";

export type MessageRole = "USER" | "ASSISTANT";

export interface ChatMessageItem {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  chartConfig?: ChartSpec | null;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  uploadedFileId: string | null;
  updatedAt: string;
  _count: { messages: number };
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  uploadedFileId: string | null;
  messages: ChatMessageItem[];
  uploadedFile: { id: string; fileName: string; originalName: string } | null;
}

export interface UploadedFileSummary {
  id: string;
  fileName: string;
  originalName: string;
  rowCount: number | null;
  columnCount: number | null;
  uploadedAt: string;
}
