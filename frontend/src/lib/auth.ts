import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/schemas/auth.schema";

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SESSION_ONLY_MAX_AGE = 60 * 60 * 24; // 1 day

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: REMEMBER_ME_MAX_AGE },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse({
          email: rawCredentials?.email,
          password: rawCredentials?.password,
          remember: rawCredentials?.remember === "true",
        });
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          remember: parsed.data.remember,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "OWNER";

        const remember = (user as { remember?: boolean }).remember;
        if (remember === false) {
          token.exp = Math.floor(Date.now() / 1000) + SESSION_ONLY_MAX_AGE;
        }
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.image === "string") token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
