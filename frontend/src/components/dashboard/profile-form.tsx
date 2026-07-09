"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { profileSchema, type ProfileFormValues } from "@/schemas/profile.schema";

function initialsFor(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

interface ProfileFormProps {
  defaultValues: { name: string; image: string; email: string };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: defaultValues.name, image: defaultValues.image },
  });

  const watchedImage = form.watch("image");
  const watchedName = form.watch("name");

  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Something went wrong.");
        return;
      }

      await update({ name: values.name, image: values.image });
      router.refresh();
      toast.success("Profile updated.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-foreground/15">
            <AvatarImage src={watchedImage || undefined} alt={watchedName} />
            <AvatarFallback className="bg-foreground/5 text-lg font-semibold text-foreground">
              {initialsFor(watchedName, defaultValues.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{defaultValues.email}</p>
            <p className="text-xs text-muted-foreground">
              Your login email — contact support to change it.
            </p>
          </div>
        </div>

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
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Image URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-foreground font-medium text-background hover:bg-foreground/90"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
