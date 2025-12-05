import { Resend } from 'resend';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  template?: string; // Name of the template, e.g. "WelcomeEmail"
  props?: Record<string, unknown>; // Props passed to the template for debugging
}

export const sendEmail = async ({ 
  to, 
  subject, 
  react, 
  from = 'Drachenboot Manager <onboarding@resend.dev>',
  template = 'unknown',
  props = {}
}: SendEmailParams) => {
  const recipients = Array.isArray(to) ? to : [to];
  
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email not sent.');
    // Log failed attempt
    await prisma.sentEmail.create({
      data: {
        to: recipients,
        subject,
        template,
        props: props as Prisma.InputJsonValue,
        status: 'failed',
        error: 'Missing API Key',
      },
    });
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      // Log failed email
      await prisma.sentEmail.create({
        data: {
          to: recipients,
          subject,
          template,
          props: props as Prisma.InputJsonValue,
          status: 'failed',
          error: JSON.stringify(error),
        },
      });
      return { success: false, error };
    }

    // Log successful email
    await prisma.sentEmail.create({
      data: {
        to: recipients,
        subject,
        template,
        props: props as Prisma.InputJsonValue,
        resendId: data?.id,
        status: 'sent',
      },
    });

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending email:', error);
    // Log exception
    await prisma.sentEmail.create({
      data: {
        to: recipients,
        subject,
        template,
        props: props as Prisma.InputJsonValue,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { success: false, error };
  }
};
