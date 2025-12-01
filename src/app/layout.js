import { Inter } from "next/font/google";
import "./globals.css";
import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Drachenboot Planer",
  description: "Team Manager & Boots-Besetzung",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/logo-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drachenboot Planer",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <DrachenbootProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </DrachenbootProvider>
      </body>
    </html>
  );
}
