import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChatSessionSchema } from "@/schemas/chat.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      uploadedFileId: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createChatSessionSchema.parse(body);

    const chatSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        uploadedFileId: data.uploadedFileId,
        title: data.title ?? "New Conversation",
      },
    });

    return NextResponse.json({ session: chatSession }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[chat/sessions] create failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
