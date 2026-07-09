"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/landing/section-heading";
import { HOW_IT_WORKS } from "@/constants/landing";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From spreadsheet to insight in three steps"
          description="No setup, no training, no technical skills required."
        />

        <div className="relative mt-20 grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent md:block" />
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              className="relative text-center md:text-left"
            >
              <div className="relative z-10 mx-auto flex size-20 items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground shadow-[0_0_0_6px_var(--background)] md:mx-0">
                <step.icon className="size-7" strokeWidth={1.5} />
              </div>
              <span className="mt-5 block font-heading text-sm text-muted-foreground">
                Step {step.step}
              </span>
              <h3 className="mt-1 font-heading text-xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
