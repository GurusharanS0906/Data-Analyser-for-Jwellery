import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/schemas/profile.schema";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = profileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        image: data.image || null,
      },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[profile] update failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
