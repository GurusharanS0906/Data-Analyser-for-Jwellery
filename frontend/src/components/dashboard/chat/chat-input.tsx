"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-secondary/40 p-2">
      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? "Ask a question about your data..."}
        rows={1}
        className="max-h-40 min-h-0 flex-1 resize-none border-none bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={submit}
        className="shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
