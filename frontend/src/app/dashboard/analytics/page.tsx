import type { Metadata } from "next";
import { AnalyticsPanel } from "@/components/dashboard/analytics/analytics-panel";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generated charts from your customer data — revenue breakdowns, trends,
          and customer share.
        </p>
      </div>

      <AnalyticsPanel />
    </div>
  );
}
