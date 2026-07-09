import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetPasswordApiSchema } from "@/schemas/auth.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordApiSchema.parse(body);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[reset-password] failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
