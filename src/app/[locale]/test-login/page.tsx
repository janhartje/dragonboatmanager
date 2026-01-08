import { auth } from "@/auth"
import { redirect } from "@/i18n/routing"
import TestLoginView from "@/components/auth/TestLoginView"

export default async function TestLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth()
  
  const isDev = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const isLocalProduction = process.env.ENABLE_TEST_USER === 'true';

  // Only allow access if in dev/test or explicitly enabled
  if (!isDev && !isTest && !isLocalProduction) {
    redirect({ href: "/", locale })
  }
  
  if (session?.user) {
    redirect({ href: "/app", locale })
  }

  return <TestLoginView />
}
