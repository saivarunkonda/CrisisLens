import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import { supabaseAdapter } from "@/lib/supabaseAuth";
import { NextResponse } from "next/server";
import { credentialsRoleForEmail, roleForEmail, type Role } from "@/lib/rbac";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const demoUsers: Record<string, string> = {
        "admin@crisislens.local": "CrisisLens2026!",
        "analyst@crisislens.local": "DemoUser2026!",
        "viewer@crisislens.local": "ViewOnly2026!",
      };

      const expected = demoUsers[email.toLowerCase()];
      if (!expected || password !== expected) return null;

      const role = credentialsRoleForEmail(email);
      return {
        id: email,
        email,
        name: email.split("@")[0],
        role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  adapter: process.env.AUTH_BACKEND === "supabase" ? supabaseAdapter : undefined,
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;

      if (path.startsWith("/api/auth")) return true;
      if (path === "/login") return true;

      if (!auth?.user) {
        return false;
      }

      const role = (auth.user as { role?: Role }).role ?? "analyst";

      if (path.startsWith("/ml") && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? user.email ?? "";
        if (account?.provider === "credentials") {
          token.role = (user as { role: Role }).role;
        } else {
          token.role = roleForEmail(user.email);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "analyst";
      }
      return session;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
