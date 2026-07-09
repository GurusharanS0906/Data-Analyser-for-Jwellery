"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/landing/section-heading";
import { PRICING_PLANS } from "@/constants/landing";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing that scales with your store"
          description="Every plan includes a 14-day free trial. No setup fees, cancel anytime."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="relative"
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 bg-foreground text-background hover:bg-foreground">
                  Most Popular
                </Badge>
              )}
              <Card
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-8",
                  plan.highlighted
                    ? "border-foreground/20 bg-gradient-to-b from-foreground/[0.03] to-transparent shadow-[0_16px_50px_-20px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_50px_-20px_rgba(255,255,255,0.04)]"
                    : "border-border/80"
                )}
              >
                <h3 className="font-heading text-xl font-semibold">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-semibold">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span className="text-foreground/85">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-8 h-11 rounded-full font-medium",
                    plan.highlighted
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : ""
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
