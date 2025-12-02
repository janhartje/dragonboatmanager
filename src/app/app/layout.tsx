import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { TourProvider } from "@/context/TourContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DrachenbootProvider>
      <TourProvider>
        {children}
      </TourProvider>
    </DrachenbootProvider>
  );
}
