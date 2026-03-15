import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize() {
        // Actual authorization logic is in auth.ts (server-only)
        // This stub is needed so the middleware knows Credentials exists
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token }) {
      // In middleware, just pass through the token as-is.
      // The full jwt callback in auth.ts populates id/username/usernameSet
      // on login. Once set, they persist in the JWT across requests.
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.usernameSet = token.usernameSet as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
