"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SectionHeading } from "@/components/landing/section-heading";
import { contactFormSchema, type ContactFormValues } from "@/schemas/contact.schema";

const CONTACT_DETAILS = [
  { icon: Mail, label: "hello@jewelleryai.app" },
  { icon: Phone, label: "+91 98765 43210" },
  { icon: MapPin, label: "Coimbatore, Tamil Nadu, India" },
];

export function Contact() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", shopName: "", message: "" },
  });

  async function onSubmit(values: ContactFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    toast.success("Message sent!", {
      description: `Thanks ${values.name.split(" ")[0]}, our team will get back to you within 24 hours.`,
    });
    form.reset();
  }

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Get in touch"
          title="Ready to see your data differently?"
          description="Tell us about your store and we'll set up a personalised walkthrough."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <div className="space-y-5">
              {CONTACT_DETAILS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-foreground/5 text-foreground">
                    <item.icon className="size-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-3"
          >
            <Card className="rounded-2xl border-border/80 p-6 sm:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Priya Ramachandran" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@shop.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Meenakshi Jewellers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Tell us about your store and what you'd like to track..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="h-11 w-full rounded-full bg-foreground font-medium text-background hover:bg-foreground/90 sm:w-auto sm:px-8"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
