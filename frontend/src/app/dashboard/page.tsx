import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Package,
  UploadCloud,
  MessageSquareText,
  ArrowRight,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [recentUploads, recentQuestions] = await Promise.all([
    prisma.uploadedFile.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    }),
    prisma.chatMessage.findMany({
      where: { role: "USER", chatSession: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, content: true, createdAt: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome back, {session!.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your jewellery analytics.
        </p>
      </div>

      {/*
        Uploaded files are queryable in DuckDB now, but computing "revenue" or
        "top city" from an arbitrary spreadsheet schema needs the Claude-driven
        SQL engine landing in Phase 5 — these cards stay honest until then.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Users}
          label="Total Customers"
          value="—"
          hint="Upload a file to see this"
          isEmpty
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value="—"
          hint="Upload a file to see this"
          isEmpty
        />
        <StatCard
          icon={TrendingUp}
          label="Average Purchase"
          value="—"
          hint="Upload a file to see this"
          isEmpty
        />
        <StatCard
          icon={MapPin}
          label="Top City"
          value="—"
          hint="Upload a file to see this"
          isEmpty
        />
        <StatCard
          icon={Package}
          label="Top Product"
          value="—"
          hint="Upload a file to see this"
          isEmpty
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Recent Uploads</h2>
            {recentUploads.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                <Link href="/dashboard/upload">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
            )}
          </div>

          {recentUploads.length === 0 ? (
            <EmptyState
              icon={UploadCloud}
              title="No uploads yet"
              description="Upload your customer Excel sheet to start seeing insights here."
              action={{ label: "Upload File", href: "/dashboard/upload" }}
            />
          ) : (
            <ul className="space-y-3">
              {recentUploads.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(file.uploadedAt)} · {file.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="rounded-2xl border-border/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Recent Questions</h2>
            {recentQuestions.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                <Link href="/dashboard/chat">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
            )}
          </div>

          {recentQuestions.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No questions yet"
              description="Ask the AI something about your data once you've uploaded a file."
              action={{ label: "Open AI Chat", href: "/dashboard/chat" }}
            />
          ) : (
            <ul className="space-y-3">
              {recentQuestions.map((message) => (
                <li
                  key={message.id}
                  className="rounded-lg border border-border/70 px-3 py-2.5 text-sm"
                >
                  <p className="truncate">{message.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
