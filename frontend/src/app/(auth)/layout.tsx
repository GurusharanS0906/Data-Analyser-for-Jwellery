import { Logo } from "@/components/landing/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-noise relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-[0.03] blur-[120px] dark:opacity-[0.06]"
        style={{
          background:
            "radial-gradient(closest-side, var(--foreground) 0%, transparent 70%)",
        }}
      />
      <Logo className="mb-8" />
      {children}
    </div>
  );
}
