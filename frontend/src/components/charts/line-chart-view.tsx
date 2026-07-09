"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export function LineChartView({ spec }: { spec: ChartSpec }) {
  const isDark = useIsDark();
  const palette = getCategoricalPalette(isDark);
  const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;
  const isMultiSeries = spec.value_keys.length > 1;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke={chrome.gridline} vertical={false} />
        <XAxis
          dataKey={spec.x_key}
          tick={{ fill: chrome.mutedText, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: chrome.axis }}
        />
        <YAxis
          tick={{ fill: chrome.mutedText, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompactNumber}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} />
        {isMultiSeries && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
        {spec.value_keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={isMultiSeries ? palette[i % palette.length] : palette[0]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
