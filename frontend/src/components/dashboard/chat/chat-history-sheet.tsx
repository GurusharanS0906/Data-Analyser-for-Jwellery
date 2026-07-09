"use client";

import * as React from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatHistoryList } from "@/components/dashboard/chat/chat-history-list";
import type { ChatSessionSummary } from "@/types/chat";

interface ChatHistorySheetProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySheet(props: ChatHistorySheetProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Chat history">
          <History className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        <ChatHistoryList
          {...props}
          onSelect={(id) => {
            props.onSelect(id);
            setOpen(false);
          }}
          onNewChat={() => {
            props.onNewChat();
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
