"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsDark } from "@/hooks/use-is-dark";
import { getCategoricalPalette, CHART_CHROME } from "@/lib/chart-colors";
import { formatCompactNumber } from "@/lib/format";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { ChartSpec } from "@/types/chart";

export function BarChartView({ spec }: { spec: ChartSpec }) {
  const isDark = useIsDark();
  const palette = getCategoricalPalette(isDark);
  const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;
  const isMultiSeries = spec.value_keys.length > 1;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke={chrome.gridline} vertical={false} />
        <XAxis
          dataKey={spec.x_key}
          tick={{ fill: chrome.mutedText, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: chrome.axis }}
          interval={0}
          angle={spec.data.length > 6 ? -20 : 0}
          textAnchor={spec.data.length > 6 ? "end" : "middle"}
          height={spec.data.length > 6 ? 50 : 30}
        />
        <YAxis
          tick={{ fill: chrome.mutedText, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompactNumber}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "currentColor", opacity: 0.04 }} />
        {isMultiSeries && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
        {spec.value_keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={isMultiSeries ? palette[i % palette.length] : palette[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
