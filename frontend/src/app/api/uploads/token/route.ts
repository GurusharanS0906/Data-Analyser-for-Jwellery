import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { mintUploadToken } from "@/lib/upload-token";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await mintUploadToken(session.user.id);

  return NextResponse.json({
    token,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  });
}
