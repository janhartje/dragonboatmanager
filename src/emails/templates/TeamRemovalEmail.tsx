import { Text, Section, Heading } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface TeamRemovalEmailProps {
  teamName: string;
  userName: string;
  lang?: Language;
}

// Helper to replace placeholders
const interpolate = (str: string, params: Record<string, string>): string => {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    str
  );
};

export const TeamRemovalEmail = ({ 
  teamName,
  userName,
  lang = 'de'
}: TeamRemovalEmailProps) => {
  const bodyText = interpolate(t(lang, 'emailTeamRemovalBody'), { name: userName, teamName });

  return (
    <EmailLayout 
      previewText={`${t(lang, 'emailTeamRemovalSubject')} - ${teamName}`}
      headerTitle={t(lang, 'appTitle')}
      lang={lang}
    >
      <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {t(lang, 'emailTeamRemovalTitle')}
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-4">
        {bodyText}
      </Text>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-6">
        {t(lang, 'emailTeamRemovalReason')}
      </Text>
    </EmailLayout>
  );
};

export default TeamRemovalEmail;
