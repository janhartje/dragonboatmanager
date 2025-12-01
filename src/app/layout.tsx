import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { TourProvider } from "@/context/TourContext";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drachenboot Manager",
  description: "Team Manager & Boots-Besetzung",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/logo-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drachenboot Manager",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className} suppressHydrationWarning>
        <DrachenbootProvider>
          <LanguageProvider>
            <TourProvider>
              {children}
              <Analytics />
              <SpeedInsights />
            </TourProvider>
          </LanguageProvider>
        </DrachenbootProvider>
      </body>
    </html>
  );
}
