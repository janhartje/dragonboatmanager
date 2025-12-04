"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton({ provider, children }: { provider?: string, children?: React.ReactNode }) {
  return (
    <Button onClick={() => signIn(provider, { callbackUrl: "/app" })}>
      {children || "Sign in"}
    </Button>
  )
}
