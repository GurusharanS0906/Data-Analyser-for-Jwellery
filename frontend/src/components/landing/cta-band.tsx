"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="premium-glow relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.03] via-transparent to-transparent px-8 py-16 text-center sm:px-16"
        >
          <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn your customer sheet into
            <span className="mono-gradient-text"> instant insights</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Join jewellery businesses across India making faster, data-backed
            decisions every day.
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-8 h-12 rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90"
          >
            <Link href="/signup">
              Start Your Free Trial
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
