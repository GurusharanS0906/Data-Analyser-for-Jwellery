import crypto from "crypto";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/schemas/auth.schema";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success — never reveal whether an email is registered.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[forgot-password] failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
