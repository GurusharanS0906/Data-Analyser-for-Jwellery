import { Card } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="glass-panel w-full max-w-md rounded-2xl border-border/80 p-8">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}
