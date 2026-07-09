import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

// Server-side payload (no confirmPassword — that's a client-only UX check)
export const registerApiSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.email("Enter a valid email address"),
  password: passwordRules,
});

export type RegisterApiValues = z.infer<typeof registerApiSchema>;

export const registerSchema = registerApiSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Server-side payload
export const resetPasswordApiSchema = z.object({
  token: z.string().min(1),
  password: passwordRules,
});

export type ResetPasswordApiValues = z.infer<typeof resetPasswordApiSchema>;

export const resetPasswordSchema = resetPasswordApiSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
