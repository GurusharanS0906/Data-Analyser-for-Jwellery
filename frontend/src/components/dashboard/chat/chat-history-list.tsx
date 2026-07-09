import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatSessionSummary } from "@/types/chat";

interface ChatHistoryListProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistoryList({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
}: ChatHistoryListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl"
          onClick={onNewChat}
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Your conversations will show up here.
          </p>
        ) : (
          <div className="flex flex-col gap-1 pb-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  s.id === activeSessionId
                    ? "bg-foreground/5 text-foreground"
                    : "text-foreground/80 hover:bg-secondary"
                )}
              >
                <span className="flex w-full items-center gap-1.5 truncate">
                  <MessageSquare className="size-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </span>
                <span className="pl-5 text-[11px] text-muted-foreground">
                  {s._count.messages} message{s._count.messages === 1 ? "" : "s"} ·{" "}
                  {formatRelativeTime(new Date(s.updatedAt))}
                </span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
