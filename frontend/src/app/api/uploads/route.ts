import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmUploadApiSchema } from "@/schemas/upload.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadedFiles = await prisma.uploadedFile.findMany({
    where: { userId: session.user.id, status: "READY" },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      originalName: true,
      rowCount: true,
      columnCount: true,
      uploadedAt: true,
    },
  });

  return NextResponse.json({ uploadedFiles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = confirmUploadApiSchema.parse(body);

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        userId: session.user.id,
        fileName: data.fileId,
        originalName: data.originalName,
        fileType: data.fileType,
        fileSizeKb: data.fileSizeKb,
        storagePath: data.storagePath,
        rowCount: data.rowCount,
        columnCount: data.columnCount,
        status: "READY",
        cleaningLog: data.cleaningLog
          ? (data.cleaningLog as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return NextResponse.json({ uploadedFile }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[uploads] create failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
