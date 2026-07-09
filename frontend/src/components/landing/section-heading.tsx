"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("mx-auto max-w-2xl text-center", className)}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty text-muted-foreground">
          {description}
        </p>
      )}
    </motion.div>
  );
}
