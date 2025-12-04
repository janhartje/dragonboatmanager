import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LoginView from "@/components/auth/LoginView"

export default async function LoginPage() {
  const session = await auth()
  
  if (session?.user) {
    redirect("/app")
  }

  return <LoginView />
}
