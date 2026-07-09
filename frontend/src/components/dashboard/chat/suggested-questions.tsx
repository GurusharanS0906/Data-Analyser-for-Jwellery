import { Gem, Sparkles } from "lucide-react";
import { SUGGESTED_QUESTIONS } from "@/constants/chat";

export function SuggestedQuestions({
  onSelect,
}: {
  onSelect: (question: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-foreground/5 text-foreground">
        <Gem className="size-6" />
      </div>
      <h2 className="mt-4 font-heading text-xl font-semibold">
        Ask anything about your data
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        I can analyze customers, revenue, products, and trends from your uploaded
        file — just ask in plain English.
      </p>

      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3.5 py-2 text-xs text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.03] hover:text-foreground"
          >
            <Sparkles className="size-3" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
