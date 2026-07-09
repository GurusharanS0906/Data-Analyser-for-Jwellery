import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground underline underline-offset-2 hover:text-foreground-dark"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap font-mono text-xs">{children}</code>
      );
    }
    return (
      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-secondary/60 p-3 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto rounded-lg border border-border last:mb-0">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-3 py-2">{children}</td>,
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
