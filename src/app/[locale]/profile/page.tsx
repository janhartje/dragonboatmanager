import { auth } from "@/auth"
import { redirect } from "@/i18n/routing"
import ProfileView from "@/components/auth/ProfileView"

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth()
  
  if (!session) {
    redirect({ href: "/login", locale })
  }

  return <ProfileView />
}
