"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, MapPin, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <div className="bg-noise pointer-events-none absolute inset-0 -z-10" />
      <div
        className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.04] blur-[120px] dark:opacity-[0.08]"
        style={{
          background:
            "radial-gradient(closest-side, var(--foreground) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/[0.03] px-4 py-1.5 text-sm text-foreground/80"
        >
          <Sparkles className="size-3.5" />
          Powered by AI &amp; Natural Language Analytics
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="text-balance font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
        >
          AI-Powered Jewellery
          <br />
          <span className="mono-gradient-text">Customer Analytics</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
        >
          Upload your customer Excel sheet. Ask anything in plain English.
          Get instant, boardroom-ready insights — no analysts, no SQL, no
          waiting.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="group h-12 rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90"
          >
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full border-border px-8 text-base font-medium"
          >
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="show"
          custom={4}
          variants={fadeUp}
          className="mt-4 text-xs text-muted-foreground"
        >
          No credit card required · 14-day free trial · Cancel anytime
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
        className="relative mx-auto mt-20 max-w-4xl px-4 sm:px-6 lg:px-8"
      >
        <Card className="glass-panel premium-glow overflow-hidden rounded-3xl p-0 text-left">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <span className="size-2.5 rounded-full bg-foreground/20" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/10" />
            <span className="ml-3 text-xs text-muted-foreground">
              AI Chat — customers.xlsx
            </span>
          </div>
          <div className="space-y-4 p-6">
            <div className="ml-auto max-w-md rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm">
              What percentage of customers from Coimbatore purchased Gold
              Bangles?
            </div>
            <div className="flex max-w-lg items-start gap-3 rounded-2xl rounded-tl-sm border border-foreground/10 bg-foreground/[0.02] px-4 py-3 text-sm">
              <Gem className="mt-0.5 size-4 shrink-0 text-foreground/60" />
              <span>
                <strong className="text-foreground">38.4%</strong> of customers
                from Coimbatore purchased Gold Bangles — the highest of any
                product category in that district, generating{" "}
                <strong>₹1.24 Cr</strong> in revenue this year.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: TrendingUp, label: "Revenue", value: "+22%" },
                { icon: MapPin, label: "Top District", value: "Coimbatore" },
                { icon: Gem, label: "Top Product", value: "Gold Bangles" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card/60 px-3 py-3 text-center"
                >
                  <stat.icon className="mx-auto mb-1 size-4 text-foreground/60" />
                  <p className="text-sm font-semibold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
