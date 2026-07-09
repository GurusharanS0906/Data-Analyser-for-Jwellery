import type { ChartSpec } from "@/types/chart";

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface StreamAskParams {
  fileId: string;
  question: string;
  history: ChatHistoryTurn[];
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

interface StreamAskResult {
  text: string;
  chart: ChartSpec | null;
}

async function getBackendToken(): Promise<{ token: string; apiUrl: string }> {
  const response = await fetch("/api/uploads/token");
  if (!response.ok) {
    throw new Error("Could not start a chat session. Please log in again.");
  }
  return response.json();
}

function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

function parseChartHeader(value: string | null): ChartSpec | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeBase64Utf8(value)) as ChartSpec;
  } catch {
    return null;
  }
}

/** Streams the AI's answer token-by-token from FastAPI directly (same bridge-token
 * pattern as uploads), calling onChunk as each piece of text arrives. A chart spec,
 * if the question warranted one, rides in a response header set before the stream
 * body begins. */
export async function streamAsk({
  fileId,
  question,
  history,
  onChunk,
  signal,
}: StreamAskParams): Promise<StreamAskResult> {
  const { token, apiUrl } = await getBackendToken();

  const response = await fetch(`${apiUrl}/api/v1/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ file_id: fileId, question, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "The AI couldn't answer that question.");
  }

  const chart = parseChartHeader(response.headers.get("X-Chart-Spec"));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(chunk);
  }

  return { text: fullText, chart };
}
