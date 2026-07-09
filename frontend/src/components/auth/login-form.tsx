"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthCard } from "@/components/auth/auth-card";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      remember: String(values.remember),
      redirect: false,
    });
    setIsSubmitting(false);

    if (result?.error) {
      toast.error("Invalid email or password.");
      return;
    }

    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your Jewellery AI Analytics dashboard"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Start free trial
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton callbackUrl={callbackUrl} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-muted-foreground">
                    Remember me for 30 days
                  </FormLabel>
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
                <LogIn className="size-4" />
              )}
              Log In
            </Button>
          </form>
        </Form>
      </div>
    </AuthCard>
  );
}
