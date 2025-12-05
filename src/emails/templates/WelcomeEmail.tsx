import { Button, Text, Section, Heading } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface WelcomeEmailProps {
  username?: string;
  loginUrl?: string;
  lang?: Language;
}

export const WelcomeEmail = ({ 
  username = "Drachenboot Fan",
  loginUrl = "https://drachenboot-manager.vercel.app/login",
  lang = 'de'
}: WelcomeEmailProps) => {
  return (
    <EmailLayout 
      previewText={t(lang, 'emailWelcomeSubject')}
      headerTitle={t(lang, 'appTitle')}
      lang={lang}
    >
      <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {t(lang, 'emailWelcomeGreeting')} {username},
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-4">
        {t(lang, 'emailWelcomeIntro')}
      </Text>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-6">
        {t(lang, 'emailWelcomeBody')}
      </Text>

      <Section className="text-center my-8">
        <Button 
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg text-center no-underline"
          href={loginUrl}
        >
          {t(lang, 'emailWelcomeCTA')}
        </Button>
      </Section>
      
      <Text className="text-slate-600 dark:text-slate-400 text-sm">
        {t(lang, 'emailWelcomeLinkHint')}
        <br />
        <a href={loginUrl} className="text-blue-600 dark:text-blue-400 underline">{loginUrl}</a>
      </Text>
    </EmailLayout>
  );
};

export default WelcomeEmail;
