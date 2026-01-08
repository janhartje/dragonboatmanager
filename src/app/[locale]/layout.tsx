import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { DrachenbootProvider } from "@/context/DrachenbootContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TeamProvider } from "@/context/TeamContext";
import { SessionProvider } from "next-auth/react";
import { getBaseUrl } from "@/utils/url";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import StructuredData from "@/components/seo/StructuredData";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = getBaseUrl();

  return {
    title: {
      default: t('title.default'),
      template: t('title.template')
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'de': '/de',
        'en': '/en',
      },
    },
    openGraph: {
      type: "website",
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      url: `/${locale}`,
      title: t('title.default'),
      description: t('description'),
      siteName: "Drachenboot Manager",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Dragboat Manager",
        },
      ],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ThemeProvider>
              <TeamProvider>
                <DrachenbootProvider>
                  {children}
                  <Analytics />
                  <SpeedInsights />
                  <StructuredData />
                </DrachenbootProvider>
              </TeamProvider>
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
