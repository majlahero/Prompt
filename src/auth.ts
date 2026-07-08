import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        await prisma.user.upsert({
          where: { googleId: account.providerAccountId },
          update: {
            name: profile.name ?? undefined,
            email: profile.email,
            image: (profile as Record<string, unknown>).picture as string ?? undefined,
          },
          create: {
            googleId: account.providerAccountId,
            name: profile.name ?? null,
            email: profile.email,
            image: ((profile as Record<string, unknown>).picture as string) ?? null,
          },
        });
        return true;
      }
      return false;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        const user = await prisma.user.findUnique({
          where: { googleId: account.providerAccountId },
        });
        if (user) {
          token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
