import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordReportSchema } from "@/schemas/report.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
      uploadedFile: { select: { originalName: true } },
    },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = recordReportSchema.parse(body);

    // Reports stream on demand from FastAPI rather than being persisted as
    // files, so filePath stores a regeneration reference, not a disk path.
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        uploadedFileId: data.uploadedFileId,
        title: data.title,
        type: data.type,
        filePath: `generated:${data.type.toLowerCase()}:${data.uploadedFileId}`,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[reports] record failed:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
