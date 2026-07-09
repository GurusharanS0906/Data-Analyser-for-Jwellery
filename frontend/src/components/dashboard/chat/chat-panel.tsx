"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHistoryList } from "@/components/dashboard/chat/chat-history-list";
import { ChatHistorySheet } from "@/components/dashboard/chat/chat-history-sheet";
import { FileSelector } from "@/components/dashboard/file-selector";
import { MessageBubble } from "@/components/dashboard/chat/message-bubble";
import { ChatInput } from "@/components/dashboard/chat/chat-input";
import { SuggestedQuestions } from "@/components/dashboard/chat/suggested-questions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { streamAsk } from "@/lib/chat-client";
import type {
  ChatMessageItem,
  ChatSessionSummary,
  UploadedFileSummary,
} from "@/types/chat";

function initialsFor(name?: string | null, email?: string | null) {
  if (name) {
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

interface DisplayMessage extends Omit<ChatMessageItem, "id"> {
  id: string;
  isStreaming?: boolean;
}

export function ChatPanel() {
  const { data: authSession } = useSession();

  const [files, setFiles] = React.useState<UploadedFileSummary[]>([]);
  const [sessions, setSessions] = React.useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadInitialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [filesRes, sessionsRes] = await Promise.all([
        fetch("/api/uploads"),
        fetch("/api/chat/sessions"),
      ]);
      const filesData = await filesRes.json();
      const sessionsData = await sessionsRes.json();
      setFiles(filesData.uploadedFiles ?? []);
      setSessions(sessionsData.sessions ?? []);
      if (filesData.uploadedFiles?.length > 0) {
        setSelectedFileId(filesData.uploadedFiles[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshSessions() {
    const res = await fetch("/api/chat/sessions");
    const data = await res.json();
    setSessions(data.sessions ?? []);
  }

  async function handleSelectSession(sessionId: string) {
    const res = await fetch(`/api/chat/sessions/${sessionId}`);
    if (!res.ok) {
      toast.error("Could not load that conversation.");
      return;
    }
    const data = await res.json();
    setActiveSessionId(sessionId);
    setMessages(data.session.messages);
    if (data.session.uploadedFileId) {
      setSelectedFileId(data.session.uploadedFileId);
    }
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
  }

  async function handleSend(question: string) {
    if (!selectedFileId) {
      toast.error("Select a file to chat about first.");
      return;
    }

    // selectedFileId is the Prisma UploadedFile.id (needed for the ChatSession
    // relation); the backend identifies files by the separate `fileName` (its
    // own UUID), so resolve that before calling the AI.
    const backendFileId = files.find((f) => f.id === selectedFileId)?.fileName;
    if (!backendFileId) {
      toast.error("Could not find that file. Try selecting it again.");
      return;
    }

    const userMessage: DisplayMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const createRes = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadedFileId: selectedFileId }),
        });
        const createData = await createRes.json();
        sessionId = createData.session.id;
        setActiveSessionId(sessionId);
      }

      await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "USER", content: question }),
      });

      const history = messages.slice(-10).map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const streamingId = `streaming-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: streamingId, role: "ASSISTANT", content: "", createdAt: new Date().toISOString(), isStreaming: true },
      ]);

      const { text: fullAnswer, chart } = await streamAsk({
        fileId: backendFileId,
        question,
        history,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId ? { ...m, isStreaming: false, chartConfig: chart } : m
        )
      );

      await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "ASSISTANT",
          content: fullAnswer,
          chartConfig: chart ?? undefined,
        }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The AI couldn't respond.");
      setMessages((prev) => prev.filter((m) => !m.isStreaming));
    } finally {
      setIsSending(false);
      refreshSessions();
    }
  }

  const historyProps = {
    sessions,
    activeSessionId,
    onSelect: handleSelectSession,
    onNewChat: handleNewChat,
  };

  if (!isLoading && files.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <EmptyState
          icon={UploadCloud}
          title="Upload a file to start chatting"
          description="AI Chat answers questions about your uploaded customer data — upload a file first."
          action={{ label: "Upload File", href: "/dashboard/upload" }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4">
      <aside className="hidden w-72 shrink-0 rounded-2xl border border-border lg:block">
        <ChatHistoryList {...historyProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <ChatHistorySheet {...historyProps} />
          <FileSelector
            files={files}
            selectedFileId={selectedFileId}
            onChange={setSelectedFileId}
            placeholder="Select a file to chat about"
            disabled={isSending}
          />
        </div>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <SuggestedQuestions onSelect={handleSend} />
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content || "…"}
                  isStreaming={m.isStreaming}
                  chartConfig={m.chartConfig}
                  userImage={authSession?.user?.image}
                  userInitials={initialsFor(authSession?.user?.name, authSession?.user?.email)}
                />
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-3">
          <ChatInput onSend={handleSend} disabled={isSending || !selectedFileId} />
        </div>
      </div>
    </div>
  );
}
