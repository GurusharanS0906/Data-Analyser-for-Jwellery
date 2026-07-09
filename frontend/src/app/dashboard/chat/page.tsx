import type { Metadata } from "next";
import { ChatPanel } from "@/components/dashboard/chat/chat-panel";

export const metadata: Metadata = { title: "AI Chat" };

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">AI Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about your customer data in plain English.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
