import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    GitHub,
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
