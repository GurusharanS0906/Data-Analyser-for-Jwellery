import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const settings = await prisma.companySettings.findUnique({
    where: { userId: session!.user.id },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your company details, currency, and language.
        </p>
      </div>

      <Card className="rounded-2xl border-border/80 p-6">
        <h2 className="mb-5 font-heading text-base font-semibold">Company</h2>
        <SettingsForm
          defaultValues={{
            companyName: settings?.companyName ?? "",
            logoUrl: settings?.logoUrl ?? "",
            currency: (settings?.currency ?? "INR") as "INR" | "USD" | "EUR" | "GBP",
            language: (settings?.language ?? "en") as "en" | "ta" | "hi",
          }}
        />
      </Card>
    </div>
  );
}
