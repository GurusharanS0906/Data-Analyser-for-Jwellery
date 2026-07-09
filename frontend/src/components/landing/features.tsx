"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { FEATURES } from "@/constants/landing";

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Everything you need"
          title="One platform for every jewellery analytics question"
          description="From natural language search to AI-generated reports, every feature is built to turn raw spreadsheets into decisions in seconds."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: "easeOut" }}
            >
              <Card className="group h-full rounded-2xl border-border/80 p-6 transition-all hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_-16px_rgba(255,255,255,0.06)]">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-foreground/5 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <feature.icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
