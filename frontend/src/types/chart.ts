export type ChartType = "bar" | "pie" | "donut" | "line" | "area" | "heatmap";

export interface ChartSpec {
  type: ChartType;
  title: string;
  x_key: string;
  y_key?: string | null;
  value_keys: string[];
  data: Record<string, unknown>[];
}
