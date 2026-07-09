import type { Metadata } from "next";
import { ReportsPanel } from "@/components/dashboard/reports/reports-panel";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generated business insights and downloadable reports from your customer data.
        </p>
      </div>

      <ReportsPanel />
    </div>
  );
}
