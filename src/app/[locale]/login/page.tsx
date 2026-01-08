import { auth } from "@/auth"
import { redirect } from "@/i18n/routing"
import LoginView from "@/components/auth/LoginView"

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth()
  
  if (session?.user) {
    redirect({ href: "/app", locale })
  }

  return <LoginView />
}
