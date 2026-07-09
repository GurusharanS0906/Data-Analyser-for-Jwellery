"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthCard } from "@/components/auth/auth-card";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth.schema";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Something went wrong.");
        return;
      }

      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, we've sent a reset link."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground/5 text-foreground">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            The link expires in 1 hour. You can close this page.
          </p>
          <Link href="/login" className="text-sm font-medium text-foreground hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Back to log in
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@shop.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Send Reset Link
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
