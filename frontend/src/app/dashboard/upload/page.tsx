import type { Metadata } from "next";
import { UploadFlow } from "@/components/dashboard/upload/upload-flow";

export const metadata: Metadata = { title: "Upload File" };

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Upload Customer File
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an Excel or CSV file of your customer data. We&apos;ll check it for
          issues and let you review before anything is saved.
        </p>
      </div>

      <UploadFlow />
    </div>
  );
}
