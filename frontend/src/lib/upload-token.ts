import { SignJWT } from "jose";

const UPLOAD_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes — long enough for a slow 100MB upload

function getSecretKey() {
  const secret = process.env.BACKEND_JWT_SECRET;
  if (!secret) {
    throw new Error("BACKEND_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function mintUploadToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_TTL_SECONDS)
    .sign(getSecretKey());
}
