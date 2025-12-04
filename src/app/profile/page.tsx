import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ProfileView from "@/components/auth/ProfileView"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return <ProfileView />
}
