"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionHeading } from "@/components/landing/section-heading";
import { TESTIMONIALS } from "@/constants/landing";

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Trusted by jewellers"
          title="Loved by jewellery businesses across South India"
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <Card className="flex h-full flex-col rounded-2xl border-border/80 p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="size-4 fill-foreground text-foreground"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="border border-foreground/15">
                    <AvatarFallback className="bg-foreground/5 text-xs font-semibold text-foreground">
                      {t.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
