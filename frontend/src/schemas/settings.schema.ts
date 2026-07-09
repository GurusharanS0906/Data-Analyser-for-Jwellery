import { z } from "zod";

export const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"] as const;
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "hi", label: "Hindi" },
] as const;

export const settingsSchema = z.object({
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  logoUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
  currency: z.enum(CURRENCY_OPTIONS),
  language: z.enum(["en", "ta", "hi"]),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
