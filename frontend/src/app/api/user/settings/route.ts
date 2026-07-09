import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/schemas/settings.schema";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = settingsSchema.parse(body);

    const settings = await prisma.companySettings.upsert({
      where: { userId: session.user.id },
      update: {
        companyName: data.companyName || null,
        logoUrl: data.logoUrl || null,
        currency: data.currency,
        language: data.language,
      },
      create: {
        userId: session.user.id,
        companyName: data.companyName || null,
        logoUrl: data.logoUrl || null,
        currency: data.currency,
        language: data.language,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[settings] update failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
