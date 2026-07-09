import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChatMessageSchema } from "@/schemas/chat.schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!chatSession) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = createChatMessageSchema.parse(body);

    const message = await prisma.chatMessage.create({
      data: {
        chatSessionId: id,
        role: data.role,
        content: data.content,
        chartConfig: data.chartConfig
          ? (data.chartConfig as Prisma.InputJsonValue)
          : undefined,
      },
    });

    const shouldRetitle = data.role === "USER" && chatSession.title === "New Conversation";
    await prisma.chatSession.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(shouldRetitle
          ? { title: data.content.slice(0, 60) + (data.content.length > 60 ? "…" : "") }
          : {}),
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[chat/messages] create failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
