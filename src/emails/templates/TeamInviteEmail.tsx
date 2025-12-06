import { Button, Text, Section, Heading } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import { t, Language } from '../utils/i18n';
import React from 'react';

interface TeamInviteEmailProps {
  url: string;
  teamName: string;
  inviterName?: string;
  lang?: Language;
}

// Helper to replace placeholders in translation strings
const interpolate = (str: string, params: Record<string, string>): string => {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    str
  );
};

export const TeamInviteEmail = ({ 
  url,
  teamName,
  inviterName,
  lang = 'de'
}: TeamInviteEmailProps) => {
  const bodyText = inviterName 
    ? interpolate(t(lang, 'emailTeamInviteBodyWithInviter'), { inviterName, teamName })
    : interpolate(t(lang, 'emailTeamInviteBody'), { teamName });

  return (
    <EmailLayout 
      previewText={`${t(lang, 'emailTeamInviteSubject')} - ${teamName}`}
      headerTitle={t(lang, 'appTitle')}
      lang={lang}
    >
      <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {t(lang, 'emailTeamInviteTitle')} 🐉
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-4">
        {bodyText}
      </Text>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-6">
        {t(lang, 'emailTeamInviteInfo')}
      </Text>

      <Section className="text-center my-8">
        <Button 
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg text-center no-underline"
          href={url}
        >
          {t(lang, 'emailTeamInviteCTA')}
        </Button>
      </Section>
      
      <Text className="text-slate-600 dark:text-slate-400 text-sm">
        {t(lang, 'emailTeamInviteLinkHint')}
        <br />
        <a href={url} className="text-blue-600 dark:text-blue-400 underline break-all">{url}</a>
      </Text>
      
      <Text className="text-slate-500 dark:text-slate-500 text-xs mt-6">
        {t(lang, 'emailTeamInviteExpiry')}
      </Text>
    </EmailLayout>
  );
};

export default TeamInviteEmail;

