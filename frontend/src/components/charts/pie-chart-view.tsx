"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useIsDark } from "@/hooks/use-is-dark";
import { getCategoricalPalette } from "@/lib/chart-colors";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { ChartSpec } from "@/types/chart";

export function PieChartView({ spec }: { spec: ChartSpec }) {
  const isDark = useIsDark();
  const palette = getCategoricalPalette(isDark);
  const valueKey = spec.value_keys[0];
  const isDonut = spec.type === "donut";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <Pie
          data={spec.data}
          dataKey={valueKey}
          nameKey={spec.x_key}
          cx="50%"
          cy="50%"
          innerRadius={isDonut ? 60 : 0}
          outerRadius={95}
          paddingAngle={spec.data.length > 1 ? 2 : 0}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {spec.data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          layout="vertical"
          verticalAlign="middle"
          align="right"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
