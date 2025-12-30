import { render } from '@react-email/render';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { processMailQueue } from '@/lib/mailQueue';


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

    // Process the queue immediately and wait for completion
    // This ensures the DB update happens before the function terminates
    try {
      await processMailQueue();
    } catch (err) {
      console.warn('Failed to process mail queue:', err);
      // Email is still in queue, will be picked up by cron job
    }

    return { success: true };
  } catch (error) {
    console.error('Exception queuing email:', error);
    return { success: false, error };
  }
};

