import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { TourProvider } from "@/context/TourContext";
import { AlertProvider } from "@/context/AlertContext";
import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Drachenboot Manager",
    default: "Dragon Boat Manager",
  },
};

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect({ href: "/login", locale });
  }

  return (
    <DrachenbootProvider>
      <TourProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </TourProvider>
    </DrachenbootProvider>
  );
}

