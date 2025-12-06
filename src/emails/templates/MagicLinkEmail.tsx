import { Button, Text, Section, Heading } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface MagicLinkEmailProps {
  url: string;
  lang?: Language;
}

export const MagicLinkEmail = ({ 
  url,
  lang = 'de'
}: MagicLinkEmailProps) => {
  return (
    <EmailLayout 
      previewText={t(lang, 'emailMagicLinkSubject')}
      headerTitle={t(lang, 'appTitle')}
      lang={lang}
    >
      <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {t(lang, 'emailMagicLinkTitle')}
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-6">
        {t(lang, 'emailMagicLinkBody')}
      </Text>

      <Section className="text-center my-8">
        <Button 
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg text-center no-underline"
          href={url}
        >
          {t(lang, 'emailMagicLinkCTA')}
        </Button>
      </Section>
      
      <Text className="text-slate-600 dark:text-slate-400 text-sm">
        {t(lang, 'emailMagicLinkHint')}
        <br />
        <a href={url} className="text-blue-600 dark:text-blue-400 underline break-all">{url}</a>
      </Text>
      
      <Text className="text-slate-500 dark:text-slate-500 text-xs mt-6">
        {t(lang, 'emailMagicLinkExpiry')}
      </Text>
    </EmailLayout>
  );
};

export default MagicLinkEmail;
