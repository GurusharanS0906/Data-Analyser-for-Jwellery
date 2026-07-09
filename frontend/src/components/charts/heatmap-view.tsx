"use client";

import * as React from "react";
import { useIsDark } from "@/hooks/use-is-dark";
import { getSequentialRamp } from "@/lib/chart-colors";
import { formatCompactNumber } from "@/lib/format";
import type { ChartSpec } from "@/types/chart";

/** Recharts has no built-in heatmap — this is a plain CSS-grid implementation
 * using a single-hue sequential gold ramp for magnitude, per the "compare
 * magnitude on a grid -> sequential" form rule. */
export function HeatmapView({ spec }: { spec: ChartSpec }) {
  const isDark = useIsDark();
  const ramp = getSequentialRamp(isDark);
  const valueKey = spec.value_keys[0];
  const yKey = spec.y_key ?? "";

  const { xValues, yValues, valueMap, min, max } = React.useMemo(() => {
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const map = new Map<string, number>();
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const row of spec.data) {
      const x = String(row[spec.x_key] ?? "");
      const y = String(row[yKey] ?? "");
      const v = Number(row[valueKey]) || 0;
      xSet.add(x);
      ySet.add(y);
      map.set(`${x}|${y}`, v);
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    return {
      xValues: Array.from(xSet),
      yValues: Array.from(ySet),
      valueMap: map,
      min: minVal,
      max: maxVal,
    };
  }, [spec, yKey, valueKey]);

  function colorFor(value: number | undefined) {
    if (value === undefined) return "transparent";
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const idx = Math.min(ramp.length - 1, Math.floor(ratio * ramp.length));
    return ramp[idx];
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `minmax(80px, auto) repeat(${xValues.length}, minmax(64px, 1fr))`,
        }}
      >
        <div />
        {xValues.map((x) => (
          <div
            key={x}
            className="truncate px-1 pb-1 text-center text-[11px] font-medium text-muted-foreground"
            title={x}
          >
            {x}
          </div>
        ))}

        {yValues.map((y) => (
          <React.Fragment key={y}>
            <div className="flex items-center truncate pr-2 text-[11px] font-medium text-muted-foreground">
              {y}
            </div>
            {xValues.map((x) => {
              const value = valueMap.get(`${x}|${y}`);
              return (
                <div
                  key={x}
                  title={`${x} · ${y}: ${value ?? 0}`}
                  className="flex aspect-square items-center justify-center rounded-md text-[11px] font-medium"
                  style={{
                    backgroundColor: colorFor(value),
                    color: value !== undefined && (value - min) / (max - min || 1) > 0.6 ? "#0a0a0a" : "var(--foreground)",
                  }}
                >
                  {value !== undefined ? formatCompactNumber(value) : "—"}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
