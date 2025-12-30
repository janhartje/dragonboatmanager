import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface ProcessQueueResult {
  processed: number;
  results: Array<{ id: string; status: string; error?: string }>;
}

/**
 * Process pending emails from the queue.
 * This can be called from:
 * - The cron endpoint (/api/cron/mail-queue)
 * - Directly after queueing an email (fire-and-forget)
 */
export async function processMailQueue(): Promise<ProcessQueueResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  const resend = new Resend(resendApiKey);

  // First, reset any stuck "processing" emails that are older than timeout
  const stuckTimeout = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
  await prisma.emailQueue.updateMany({
    where: {
      status: 'processing',
      updatedAt: { lt: stuckTimeout },
    },
    data: {
      status: 'pending',
      lastError: 'Reset from stuck processing state',
    },
  });

  // 1. Fetch pending emails
  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: { in: ['pending'] },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  if (pendingEmails.length === 0) {
    return { processed: 0, results: [] };
  }

  const results: ProcessQueueResult['results'] = [];

  // 2. Process each email
  for (const email of pendingEmails) {
    let markedAsProcessing = false;
    
    try {
      // Mark as processing
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'processing' },
      });
      markedAsProcessing = true;

      // Send via Resend
      const { error } = await resend.emails.send({
        from: email.from || 'Drachenboot Manager <no-reply@drachenbootmanager.de>',
        to: email.to,
        replyTo: email.replyTo || undefined,
        subject: email.subject,
        html: email.body,
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }

      // Success
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { 
          status: 'sent', 
          attempts: { increment: 1 },
        },
      });
      
      results.push({ id: email.id, status: 'sent' });

    } catch (err) {
      console.error(`Failed to send email ${email.id}:`, err);
      const isRetryable = (email.attempts + 1) < MAX_RETRIES;
      const newStatus = isRetryable ? 'pending' : 'failed';
      
      // Only update if we managed to mark it as processing
      try {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { 
            status: newStatus, 
            attempts: { increment: 1 },
            lastError: err instanceof Error ? err.message : String(err)
          },
        });
      } catch (updateErr) {
        console.error(`Failed to update email ${email.id} status:`, updateErr);
        // If we marked it as processing but can't update, it will be reset by stuck handler
      }
      
      results.push({ 
        id: email.id, 
        status: markedAsProcessing ? newStatus : 'unknown', 
        error: err instanceof Error ? err.message : String(err) 
      });
    }
  }

  return { processed: results.length, results };
}

