/**
 * Premium monochrome palette for charts — uses graduated grays
 * for both light and dark surfaces.
 * Slot order is fixed — never cycle or re-sort it per chart.
 */
export const CHART_CATEGORICAL_LIGHT = [
  "#09090b", // 1 black (brand)
  "#404040", // 2 dark gray
  "#737373", // 3 mid gray
  "#a3a3a3", // 4 light gray
  "#d4d4d4", // 5 lighter gray
  "#525252", // 6 charcoal
  "#171717", // 7 near-black
  "#8a8a8a", // 8 medium gray
] as const;

export const CHART_CATEGORICAL_DARK = [
  "#fafafa", // 1 white (brand)
  "#d4d4d4", // 2 light gray
  "#a3a3a3", // 3 mid gray
  "#737373", // 4 darker gray
  "#525252", // 5 dark gray
  "#e5e5e5", // 6 near-white
  "#f5f5f5", // 7 off-white
  "#8a8a8a", // 8 medium gray
] as const;

/** Single-hue gray ramp, light -> dark, for sequential magnitude encoding (heatmap cells). */
export const MONO_SEQUENTIAL_LIGHT = [
  "#f5f5f5",
  "#d4d4d4",
  "#a3a3a3",
  "#525252",
  "#171717",
] as const;

export const MONO_SEQUENTIAL_DARK = [
  "#171717",
  "#404040",
  "#737373",
  "#a3a3a3",
  "#e5e5e5",
] as const;

export function getCategoricalPalette(isDark: boolean): readonly string[] {
  return isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;
}

export function getSequentialRamp(isDark: boolean): readonly string[] {
  return isDark ? MONO_SEQUENTIAL_DARK : MONO_SEQUENTIAL_LIGHT;
}

/** The single accent hue for solid single-series marks (bar/line/area). */
export function getAccentColor(isDark: boolean): string {
  return isDark ? CHART_CATEGORICAL_DARK[0] : CHART_CATEGORICAL_LIGHT[0];
}

export const CHART_CHROME = {
  light: {
    gridline: "#e5e5e5",
    axis: "#d4d4d4",
    mutedText: "#737373",
  },
  dark: {
    gridline: "#262626",
    axis: "#404040",
    mutedText: "#737373",
  },
} as const;
