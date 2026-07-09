import type { ChartSpec } from "@/types/chart";

interface AutoAnalyticsResponse {
  charts: ChartSpec[];
  row_count: number;
  column_count: number;
}

async function getBackendToken(): Promise<{ token: string; apiUrl: string }> {
  const response = await fetch("/api/uploads/token");
  if (!response.ok) {
    throw new Error("Could not load analytics. Please log in again.");
  }
  return response.json();
}

export async function fetchAutoAnalytics(fileId: string): Promise<AutoAnalyticsResponse> {
  const { token, apiUrl } = await getBackendToken();

  const response = await fetch(`${apiUrl}/api/v1/analytics/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Could not load analytics for this file.");
  }

  return response.json();
}
