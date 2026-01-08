"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useLocale } from "next-intl";

export function LoginButton({ provider, children }: { provider?: string, children?: React.ReactNode }) {
  const locale = useLocale();
  return (
    <Button onClick={() => signIn(provider, { callbackUrl: `/${locale}/app` })}>
      {children || "Sign in"}
    </Button>
  )
}

