import type { NextAuthConfig } from "next-auth";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

/**
 * Edge-safe NextAuth config — no Prisma adapter, no Credentials provider
 * (both pull in Node-only APIs). This is the piece `middleware.ts` can use;
 * the full config in `auth.ts` extends this for the Node.js runtime.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname, origin } = request.nextUrl;

      const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );
      const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

      if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", origin));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
