import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { TourProvider } from "@/context/TourContext";
import { AlertProvider } from "@/context/AlertContext";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
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

