import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { SessionProvider } from "next-auth/react";
import { getBaseUrl } from "@/utils/url";

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
    "Dragon Boat", "Dragon Boat Manager", "Team Management", "Boat Lineup", "Paddler Management", "Training Planning", "Regatta Planning", "PWA", "Offline App", "Dragon Boat Team", "Crew Planning", "Dragon Boat App", "Dragon Boat Software", "Dragon Boat Planner", "Dragon Boat Racing", "Paddling App", "Water Sports Planner", "Team Roster App", "Sports Team Management", "Boat Seating Chart", "Dragon Boat Lineup Builder", "Coach Assistant", "Regatta Schedule", "Training Attendance", "Lineup Optimization", "Team Management Software", "Sports App", "Boat Trim", "Boat AI", "Automatic Lineup", "Smart Lineup", "Magic AI", "Crew AI", "Paddle Sport Manager",
    // German keywords  
    "Drachenboot", "Drachenboot Manager", "Team Management", "Bootsbesetzung", "Trainingsplanung", "Paddler", "Regatta", "Mannschaftsverwaltung", "Drachenboot App", "Drachenboot Software", "Drachenboot Planer", "Drachenboot Training", "Drachenboot Verein", "Wassersport Software", "Mannschaftssport App", "Sitzplan Drachenboot", "Drachenboot Aufstellung", "Teamkapitän App", "Vereinssport Verwaltung", "Sportverein Manager", "Regattaplanung", "Trainingsbeteiligung", "Drachenboot Rennen", "Bootsbesetzung Software", "Sport App", "Bootstrim", "Boots Trimm", "Boots AI", "Automatische Besetzung", "Magic KI", "Kader Manager Alternative", "SpielerPlus Alternative"
  ],
  authors: [{ name: "Jan Hartje" }],
  creator: "Jan Hartje",
  publisher: "Jan Hartje",
  metadataBase: new URL(getBaseUrl()),
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
  other: {
    "mobile-web-app-capable": "yes",
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
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('drachenboot_theme');
                  var isDark = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                  
                  var storedLang = localStorage.getItem('language');
                  if (storedLang) {
                    document.documentElement.lang = storedLang;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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
