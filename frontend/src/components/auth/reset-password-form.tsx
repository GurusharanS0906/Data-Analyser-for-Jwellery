"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthCard } from "@/components/auth/auth-card";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "This reset link is invalid or has expired.");
        return;
      }

      toast.success("Password updated — please log in.");
      router.push("/login");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Invalid link"
        description="This password reset link is missing its token."
        footer={
          <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Please request a new password reset link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password for your account"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
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
              <KeyRound className="size-4" />
            )}
            Update Password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
