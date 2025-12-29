import { render } from '@react-email/render';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';


interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  template?: string; // Name of the template, e.g. "WelcomeEmail"
  props?: Record<string, unknown>; // Props passed to the template for debugging
}

export const sendEmail = async ({ 
  to, 
  subject, 
  react, 
  from = 'Drachenboot Manager <no-reply@drachenbootmanager.de>',
  replyTo,
  template = 'unknown',
  props = {}
}: SendEmailParams) => {
  const recipients = Array.isArray(to) ? to : [to];
  
  try {
    // Pre-render the React component to HTML
    const html = await render(react);
    
    // Add to queue
    await prisma.emailQueue.create({
      data: {
        to: recipients,
        subject,
        body: html,
        from,
        replyTo,
        template,
        props: props as Prisma.InputJsonValue,
        status: 'pending',
      },
    });

    // Optimistically try to process the queue
    // usage of fetch here might fail if the base url is not available or if network issues
    // but the email is in the queue safe and sound
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fetch(`${baseUrl}/api/cron/mail-queue`, { method: 'GET' }).catch(err => {
            console.warn('Failed to trigger mail queue processor optimistically', err);
        });
    } catch {
        // ignore
    }

    return { success: true };
  } catch (error) {
    console.error('Exception queuing email:', error);
    // Log exception in SentEmail for visibility that it failed to even queue (db down?)
    // This is a critical failure if DB is down.
    return { success: false, error };
  }
};
