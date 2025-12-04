import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's weight in kg. */
      weight?: number | null
      /** The user's ID. */
      id: string
    } & DefaultSession["user"]
  }

  interface User {
    weight?: number | null
  }
}
