import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { TourProvider } from "@/context/TourContext";
import { AlertProvider } from "@/context/AlertContext";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Drachenboot Manager",
    default: "Dragon Boat Manager",
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware handles authentication

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

