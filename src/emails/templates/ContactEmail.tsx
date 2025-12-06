import { Text, Heading, Hr } from '@react-email/components';
import EmailLayout from '../components/EmailLayout';
import React from 'react';

interface ContactEmailProps {
  name: string;
  email: string;
  category: string;
  message: string;
}

export const ContactEmail = ({ 
  name,
  email,
  category,
  message
}: ContactEmailProps) => {
  return (
    <EmailLayout 
      previewText={`New ${category} from ${name}`}
      headerTitle="Drachenboot Manager Support"
    >
      <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        New Contact Request: {category}
      </Heading>
      
      <Text className="text-slate-700 dark:text-slate-300 mb-2">
        <span className="font-bold">From:</span> {name} ({email})
      </Text>
      
      <Hr className="border-slate-200 dark:border-slate-700 my-4" />
      
      <Text className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
        {message}
      </Text>
      
    </EmailLayout>
  );
};

export default ContactEmail;
