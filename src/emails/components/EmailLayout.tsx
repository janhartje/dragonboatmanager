import { Body, Container, Head, Html, Img, Link, Preview, Section, Text, Tailwind } from '@react-email/components';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  headerTitle?: string;
  lang?: Language;
}

export const EmailLayout = ({ children, previewText, headerTitle = "Drachenboot Manager", lang = 'de' }: EmailLayoutProps) => {
  // Use static fallback for emails - they should always point to production
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://drachenboot-manager.vercel.app';
  const logoUrl = `${baseUrl}/icons/logo-192.png`;

  return (
    <Html>
      <Preview>{previewText || headerTitle}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                slate: {
                  50: '#f8fafc',
                  100: '#f1f5f9',
                  200: '#e2e8f0',
                  300: '#cbd5e1',
                  400: '#94a3b8',
                  500: '#64748b',
                  600: '#475569',
                  700: '#334155',
                  800: '#1e293b',
                  900: '#0f172a',
                  950: '#020617',
                },
              },
            },
          },
        }}
      >
        <Head />
        <Body className="bg-slate-100 dark:bg-slate-950 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-slate-200 dark:border-slate-800 rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <Section className="mt-[20px] mb-[32px] text-center">
              <Img
                src={logoUrl}
                width="64"
                height="64"
                alt={headerTitle}
                className="mx-auto rounded-xl"
              />
            </Section>
            
            <Section className="p-4">
              {children}
            </Section>

            <Section className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Text className="m-0 mb-4">
                {t(lang, 'emailFooterMadeWith')}
              </Text>
              <Text className="m-0 mb-4">
                <Link href={`${baseUrl}/imprint`} className="text-slate-500 dark:text-slate-400 underline mx-2">{t(lang, 'imprint')}</Link>
                •
                <Link href={`${baseUrl}/privacy`} className="text-slate-500 dark:text-slate-400 underline mx-2">{t(lang, 'privacy')}</Link>
              </Text>
              <Text className="m-0 text-[10px] text-slate-400 dark:text-slate-500">
                {t(lang, 'emailFooterAuto')}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailLayout;
