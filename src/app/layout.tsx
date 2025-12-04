import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { SessionProvider } from "next-auth/react";

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Dragon Boat Manager - Team & Boat Lineup Planning",
    template: "%s | Dragon Boat Manager"
  },
  description: "Plan your dragon boat team efficiently: member management, event planning, and optimal boat lineup with AI support. Works offline as installable app. / Plane dein Drachenboot-Team effizient mit KI-Unterstützung.",
  keywords: [
    // English keywords
    "Dragon Boat", "Dragon Boat Manager", "Team Management", "Boat Lineup", "Paddler Management", "Training Planning", "Regatta Planning", "PWA", "Offline App", "Dragon Boat Team", "Crew Planning",
    // German keywords  
    "Drachenboot", "Drachenboot Manager", "Team Management", "Bootsbesetzung", "Trainingsplanung", "Paddler", "Regatta", "Mannschaftsverwaltung"
  ],
  authors: [{ name: "Jan Hartje" }],
  creator: "Jan Hartje",
  publisher: "Jan Hartje",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  alternates: {
    canonical: "/",
    languages: {
      'de-DE': '/',
      'en-US': '/',
      'en': '/',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["de_DE", "en_GB"],
    url: "/",
    title: "Dragon Boat Manager - Team & Boat Lineup Planning",
    description: "Plan your dragon boat team efficiently: member management, event planning, and optimal boat lineup with AI support. Works offline as installable app.",
    siteName: "Dragon Boat Manager",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Dragon Boat Manager - Your Team Perfectly Organized / Dein Team Perfekt Organisiert",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dragon Boat Manager - Team & Boat Lineup Planning",
    description: "Plan your dragon boat team efficiently with AI support. Offline-capable Progressive Web App for team management and optimal boat lineups.",
    images: ["/opengraph-image.png"],
    creator: "@drachenbootplan",
  },
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
        <SessionProvider>
          <LanguageProvider>
            <DrachenbootProvider>
              {children}
              <Analytics />
              <SpeedInsights />
            </DrachenbootProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
