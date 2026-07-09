import { ChartCard } from "@/components/charts/chart-card";
import { BarChartView } from "@/components/charts/bar-chart-view";
import { PieChartView } from "@/components/charts/pie-chart-view";
import { LineChartView } from "@/components/charts/line-chart-view";
import { AreaChartView } from "@/components/charts/area-chart-view";
import { HeatmapView } from "@/components/charts/heatmap-view";
import type { ChartSpec } from "@/types/chart";

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  return (
    <ChartCard title={spec.title}>
      {spec.type === "bar" && <BarChartView spec={spec} />}
      {(spec.type === "pie" || spec.type === "donut") && <PieChartView spec={spec} />}
      {spec.type === "line" && <LineChartView spec={spec} />}
      {spec.type === "area" && <AreaChartView spec={spec} />}
      {spec.type === "heatmap" && <HeatmapView spec={spec} />}
    </ChartCard>
  );
}
