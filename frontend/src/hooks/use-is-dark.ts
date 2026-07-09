"use client";

import * as React from "react";
import { useTheme } from "next-themes";

/** Resolves to false during SSR/first paint to avoid a hydration mismatch,
 * then reflects the actual resolved theme once mounted. */
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return mounted && resolvedTheme === "dark";
}
