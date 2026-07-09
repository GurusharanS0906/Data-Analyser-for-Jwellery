import { Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownContent } from "@/components/dashboard/chat/markdown-content";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { cn } from "@/lib/utils";
import type { MessageRole } from "@/types/chat";
import type { ChartSpec } from "@/types/chart";

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  chartConfig?: ChartSpec | null;
  userImage?: string | null;
  userInitials?: string;
}

export function MessageBubble({
  role,
  content,
  isStreaming,
  chartConfig,
  userImage,
  userInitials,
}: MessageBubbleProps) {
  const isUser = role === "USER";

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
        <Avatar className="size-8 shrink-0 border border-foreground/15">
          {isUser ? (
            <>
              <AvatarImage src={userImage ?? undefined} />
              <AvatarFallback className="bg-secondary text-xs font-semibold">
                {userInitials ?? "U"}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-foreground/5 text-foreground">
              <Bot className="size-4" />
            </AvatarFallback>
          )}
        </Avatar>

        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5",
            isUser
              ? "rounded-tr-sm bg-secondary"
              : "rounded-tl-sm border border-foreground/10 bg-foreground/[0.03]"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{content}</p>
          ) : (
            <>
              <MarkdownContent content={content} />
              {isStreaming && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-foreground align-middle" />
              )}
            </>
          )}
        </div>
      </div>

      {!isUser && chartConfig && (
        <div className="ml-11 max-w-xl">
          <ChartRenderer spec={chartConfig} />
        </div>
      )}
    </div>
  );
}
