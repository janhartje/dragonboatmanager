import { Button, Text, Section, Heading } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface PaymentActionRequiredEmailProps {
  teamName: string;
  teamId: string;
  lang?: Language;
  baseUrl?: string;
}

export const PaymentActionRequiredEmail = ({ 
  teamName = "Dein Team",
  teamId = "demo-team",
  lang = 'de',
  baseUrl = "https://drachenboot-manager.vercel.app"
}: PaymentActionRequiredEmailProps) => {
  const actionUrl = `${baseUrl}/app/teams/${teamId}/settings/billing`;

  return (
    <EmailLayout 
      previewText={t(lang, 'emailPaymentActionRequiredSubject')}
      headerTitle={t(lang, 'appTitle')}
      lang={lang}
    >
      <Heading className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-4">
        {t(lang, 'emailPaymentActionRequiredTitle')}
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-4">
        {t(lang, 'emailWelcomeGreeting')} {teamName},
      </Text>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-6">
        {t(lang, 'emailPaymentActionRequiredBody')}
      </Text>

      <Section className="text-center my-8">
        <Button 
          className="bg-amber-600 text-white font-bold px-6 py-3 rounded-lg text-center no-underline"
          href={actionUrl}
        >
          {t(lang, 'emailPaymentActionRequiredAction')}
        </Button>
      </Section>
      
      <Text className="text-slate-600 dark:text-slate-400 text-sm">
        {t(lang, 'emailWelcomeLinkHint')}
        <br />
        <a href={actionUrl} className="text-blue-600 dark:text-blue-400 underline">{actionUrl}</a>
      </Text>
    </EmailLayout>
  );
};

export default PaymentActionRequiredEmail;
